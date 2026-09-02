<?php

namespace App\Services;

use App\Models\AdminAuditLog;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class LegacyDatabaseCleanupService
{
    public const CONFIRMATION = 'CLEANUP_LEGACY_DATABASE';

    private const PLAN_CACHE_PREFIX = 'legacy_database_cleanup_plan:';

    private const HOTEL_EVENT_SETTING_KEYS = [
        'hotel_booking_timeout_minutes',
        'event_booking_timeout_minutes',
    ];

    private const LEGACY_PERMISSION_FEATURES = [
        'hotel_properties',
        'hotel_rooms',
        'hotel_bookings',
        'hotel_finance',
        'hotel_vouchers',
        'mitra',
        'mitra_events',
        'events_items',
        'events_tickets',
        'events_bookings',
        'events_finance',
        'events_content',
        'events_system',
    ];

    /**
     * @return array<string, mixed>
     */
    public function preview(?int $adminId = null): array
    {
        $plan = $this->buildPlan();
        $summary = $this->summary($plan);
        $planId = hash('sha256', Str::uuid()->toString().json_encode($summary).microtime(true));
        $signature = $this->signature($plan);

        Cache::put(self::PLAN_CACHE_PREFIX.$planId, [
            'signature' => $signature,
            'admin_id' => $adminId,
            'created_at' => now()->toISOString(),
        ], now()->addMinutes(30));

        $this->log($adminId, 'preview', $summary, null, 'success');

        return [
            'success' => true,
            'mode' => 'preview',
            'message' => 'Database cleanup preview generated.',
            'cleanup_plan_id' => $planId,
            'confirmation_required' => self::CONFIRMATION,
            'summary' => $summary,
            'cleanup_plan' => $plan,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function execute(string $planId, ?int $adminId = null): array
    {
        $cached = Cache::get(self::PLAN_CACHE_PREFIX.$planId);
        if (! is_array($cached)) {
            abort(422, 'Preview cleanup tidak ditemukan atau sudah kedaluwarsa.');
        }

        $plan = $this->buildPlan();
        $signature = $this->signature($plan);

        if (($cached['signature'] ?? null) !== $signature) {
            abort(409, 'Data berubah setelah preview dibuat. Jalankan preview ulang sebelum execute.');
        }

        $backupPath = $this->backupCandidates($plan);
        $deletedByTable = [];
        $updatedByTable = [];

        DB::transaction(function () use ($plan, &$deletedByTable, &$updatedByTable): void {
            foreach ($plan as $item) {
                if (($item['records'] ?? 0) < 1) {
                    continue;
                }

                $affected = $this->candidateQuery($item['key'])->delete();
                if (($item['action'] ?? null) === 'delete') {
                    $deletedByTable[$item['table']] = ($deletedByTable[$item['table']] ?? 0) + $affected;
                } else {
                    $updatedByTable[$item['table']] = ($updatedByTable[$item['table']] ?? 0) + $affected;
                }

                $this->afterOperation($item['key'], $affected);
            }
        });

        Cache::forget(self::PLAN_CACHE_PREFIX.$planId);

        $summary = [
            'records_deleted' => array_sum($deletedByTable),
            'records_updated' => array_sum($updatedByTable),
            'tables_affected' => count(array_filter($deletedByTable + $updatedByTable)),
            'deleted_by_table' => $deletedByTable,
            'updated_by_table' => $updatedByTable,
            'backup_path' => $backupPath,
        ];

        $this->log($adminId, 'execute', $summary, $backupPath, 'success');

        return [
            'success' => true,
            'mode' => 'execute',
            'message' => 'Legacy database cleanup completed successfully.',
            'summary' => $summary,
        ];
    }

    protected function afterOperation(string $key, int $affected): void
    {
        //
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function buildPlan(): array
    {
        return collect($this->operations())
            ->filter(fn (array $operation): bool => Schema::hasTable($operation['table']))
            ->map(function (array $operation): array {
                $records = (clone $this->candidateQuery($operation['key']))->count();
                $current = DB::table($operation['table'])->count();

                return [
                    'key' => $operation['key'],
                    'table' => $operation['table'],
                    'action' => $operation['action'],
                    'current_records' => $current,
                    'candidate_delete' => $operation['action'] === 'delete' ? $records : 0,
                    'candidate_update' => $operation['action'] === 'update' ? $records : 0,
                    'records' => $records,
                    'retained_records' => max(0, $current - $records),
                    'reason' => $operation['reason'],
                    'risk' => $operation['risk'],
                    'dependency' => $operation['dependency'],
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function operations(): array
    {
        return [
            [
                'key' => 'product_review_media_legacy',
                'table' => 'product_review_media',
                'action' => 'delete',
                'risk' => 'MEDIUM',
                'reason' => 'Media ulasan produk Hotel/Event menjadi legacy ketika platform hanya fokus Wisata.',
                'dependency' => 'product_reviews.product_type in hotel/event',
            ],
            [
                'key' => 'product_reviews_legacy',
                'table' => 'product_reviews',
                'action' => 'delete',
                'risk' => 'MEDIUM',
                'reason' => 'Ulasan produk Hotel/Event tidak lagi tampil pada katalog Wisata.',
                'dependency' => 'Tidak memiliki FK ke produk; filter eksplisit berdasarkan product_type.',
            ],
            [
                'key' => 'room_inventories_unbooked_hotels',
                'table' => 'room_inventories',
                'action' => 'delete',
                'risk' => 'LOW',
                'reason' => 'Inventori kamar hanya milik Hotel tanpa booking historis.',
                'dependency' => 'room_types -> hotels tanpa bookings/payouts.',
            ],
            [
                'key' => 'room_images_unbooked_hotels',
                'table' => 'room_images',
                'action' => 'delete',
                'risk' => 'LOW',
                'reason' => 'Gambar kamar hanya milik Hotel tanpa booking historis.',
                'dependency' => 'room_types -> hotels tanpa bookings/payouts.',
            ],
            [
                'key' => 'hotel_images_unbooked_hotels',
                'table' => 'hotel_images',
                'action' => 'delete',
                'risk' => 'LOW',
                'reason' => 'Gambar Hotel tanpa booking historis dapat dibersihkan.',
                'dependency' => 'hotels tanpa bookings/payouts.',
            ],
            [
                'key' => 'hotel_taxes_unbooked_hotels',
                'table' => 'hotel_taxes',
                'action' => 'delete',
                'risk' => 'LOW',
                'reason' => 'Konfigurasi pajak Hotel tanpa booking historis tidak dipakai modul Wisata.',
                'dependency' => 'hotels tanpa bookings/payouts.',
            ],
            [
                'key' => 'hotel_facilities_unbooked_hotels',
                'table' => 'hotel_facilities',
                'action' => 'delete',
                'risk' => 'LOW',
                'reason' => 'Fasilitas Hotel tanpa booking historis tidak dipakai modul Wisata.',
                'dependency' => 'hotels tanpa bookings/payouts.',
            ],
            [
                'key' => 'room_types_unbooked_hotels',
                'table' => 'room_types',
                'action' => 'delete',
                'risk' => 'MEDIUM',
                'reason' => 'Tipe kamar Hotel tanpa booking historis dapat dibersihkan setelah child rows.',
                'dependency' => 'Tidak punya booking_rooms dan hotel induknya tidak punya histori.',
            ],
            [
                'key' => 'hotels_without_financial_history',
                'table' => 'hotels',
                'action' => 'delete',
                'risk' => 'MEDIUM',
                'reason' => 'Master Hotel tanpa booking, payment, payout, komisi, voucher, atau histori finansial.',
                'dependency' => 'Bookings/payments/payouts/booking_rooms/commission_rules/vouchers tetap dipertahankan.',
            ],
            [
                'key' => 'mitra_onboardings_hotel',
                'table' => 'mitra_onboardings',
                'action' => 'delete',
                'risk' => 'MEDIUM',
                'reason' => 'Onboarding Mitra Hotel tidak lagi dipakai role Mitra Wisata.',
                'dependency' => 'Akun user tidak dihapus.',
            ],
            [
                'key' => 'event_tickets_unbooked_events',
                'table' => 'event_tickets',
                'action' => 'delete',
                'risk' => 'MEDIUM',
                'reason' => 'Tiket Event tanpa booking historis dapat dibersihkan sebelum event induk.',
                'dependency' => 'events.event_type=event tanpa event_bookings.',
            ],
            [
                'key' => 'events_without_bookings',
                'table' => 'events',
                'action' => 'delete',
                'risk' => 'MEDIUM',
                'reason' => 'Master Event tanpa booking historis dan bukan special program.',
                'dependency' => 'event_type=event; event dengan booking tetap dipertahankan.',
            ],
            [
                'key' => 'event_settings',
                'table' => 'event_settings',
                'action' => 'delete',
                'risk' => 'LOW',
                'reason' => 'Pengaturan Event tidak dipakai modul Wisata.',
                'dependency' => 'Tidak memiliki FK finansial.',
            ],
            [
                'key' => 'mitra_event_staff',
                'table' => 'mitra_event_staff',
                'action' => 'delete',
                'risk' => 'LOW',
                'reason' => 'Staff Mitra Event tidak dipakai role Mitra Wisata.',
                'dependency' => 'mitra_event_onboardings.',
            ],
            [
                'key' => 'mitra_event_onboardings',
                'table' => 'mitra_event_onboardings',
                'action' => 'delete',
                'risk' => 'MEDIUM',
                'reason' => 'Onboarding Mitra Event tidak dipakai role Mitra Wisata.',
                'dependency' => 'Akun user tidak dihapus.',
            ],
            [
                'key' => 'event_organizers_without_retained_events',
                'table' => 'event_organizers',
                'action' => 'delete',
                'risk' => 'MEDIUM',
                'reason' => 'Organizer Event yang tidak memiliki event/settlement yang perlu dipertahankan.',
                'dependency' => 'Events dengan booking dan event_settlements menahan organizer.',
            ],
            [
                'key' => 'partner_terms_signatures_hotel_event',
                'table' => 'partner_terms_signatures',
                'action' => 'delete',
                'risk' => 'MEDIUM',
                'reason' => 'Tanda tangan S&K Hotel/Event tidak relevan untuk Mitra Wisata.',
                'dependency' => 'business_type hotel/event; user tidak dihapus.',
            ],
            [
                'key' => 'partner_terms_documents_hotel_event',
                'table' => 'partner_terms_documents',
                'action' => 'delete',
                'risk' => 'MEDIUM',
                'reason' => 'Dokumen S&K Hotel/Event tidak lagi digunakan.',
                'dependency' => 'Signatures terkait dibersihkan lebih dulu.',
            ],
            [
                'key' => 'notification_triggers_hotel_event',
                'table' => 'notification_triggers',
                'action' => 'delete',
                'risk' => 'LOW',
                'reason' => 'Trigger notifikasi Hotel/Event sudah legacy.',
                'dependency' => 'event_key prefix hotel_/event_.',
            ],
            [
                'key' => 'notification_templates_hotel_event',
                'table' => 'notification_templates',
                'action' => 'delete',
                'risk' => 'LOW',
                'reason' => 'Template notifikasi Hotel/Event sudah legacy.',
                'dependency' => 'key prefix hotel_/event_.',
            ],
            [
                'key' => 'user_notifications_hotel_event',
                'table' => 'user_notifications',
                'action' => 'delete',
                'risk' => 'LOW',
                'reason' => 'Notifikasi user dari Hotel/Event tidak lagi ditampilkan pada aplikasi Wisata.',
                'dependency' => 'type prefix hotel_/event_.',
            ],
            [
                'key' => 'search_logs_hotel_event',
                'table' => 'search_logs',
                'action' => 'delete',
                'risk' => 'LOW',
                'reason' => 'Log pencarian Hotel/Event tidak diperlukan untuk analytics Wisata.',
                'dependency' => 'product_type hotel/hotels/event/events.',
            ],
            [
                'key' => 'system_settings_hotel_event',
                'table' => 'system_settings',
                'action' => 'delete',
                'risk' => 'LOW',
                'reason' => 'Setting timeout Hotel/Event tidak dipakai flow Wisata.',
                'dependency' => 'Key eksplisit Hotel/Event.',
            ],
            [
                'key' => 'admin_permission_role_hotel_event',
                'table' => 'admin_permission_role',
                'action' => 'delete',
                'risk' => 'MEDIUM',
                'reason' => 'Pivot permission admin untuk fitur Hotel/Event legacy.',
                'dependency' => 'admin_permissions.feature Hotel/Event legacy.',
            ],
            [
                'key' => 'admin_permissions_hotel_event',
                'table' => 'admin_permissions',
                'action' => 'delete',
                'risk' => 'MEDIUM',
                'reason' => 'Permission fitur Hotel/Event legacy tidak lagi diperlukan oleh fokus Wisata.',
                'dependency' => 'Feature allowlist Hotel/Event; role admin utama tetap tidak bergantung pada row ini.',
            ],
        ];
    }

    private function candidateQuery(string $key): \Illuminate\Database\Query\Builder
    {
        return match ($key) {
            'product_review_media_legacy' => DB::table('product_review_media')
                ->whereIn('product_review_id', $this->legacyProductReviewIdsQuery()),
            'product_reviews_legacy' => DB::table('product_reviews')
                ->whereIn('product_type', ['hotel', 'hotels', 'event', 'events']),
            'room_inventories_unbooked_hotels' => DB::table('room_inventories')
                ->whereIn('room_type_id', $this->roomTypeIdsForDeletableHotelsQuery()),
            'room_images_unbooked_hotels' => DB::table('room_images')
                ->whereIn('room_type_id', $this->roomTypeIdsForDeletableHotelsQuery()),
            'hotel_images_unbooked_hotels' => DB::table('hotel_images')
                ->whereIn('hotel_id', $this->deletableHotelIdsQuery()),
            'hotel_taxes_unbooked_hotels' => DB::table('hotel_taxes')
                ->whereIn('hotel_id', $this->deletableHotelIdsQuery()),
            'hotel_facilities_unbooked_hotels' => DB::table('hotel_facilities')
                ->whereIn('hotel_id', $this->deletableHotelIdsQuery()),
            'room_types_unbooked_hotels' => DB::table('room_types')
                ->whereIn('hotel_id', $this->deletableHotelIdsQuery())
                ->whereNotExists(fn ($query) => $query
                    ->selectRaw('1')
                    ->from('booking_rooms')
                    ->whereColumn('booking_rooms.room_type_id', 'room_types.id')),
            'hotels_without_financial_history' => DB::table('hotels')
                ->whereNotExists(fn ($query) => $query
                    ->selectRaw('1')
                    ->from('bookings')
                    ->whereColumn('bookings.hotel_id', 'hotels.id'))
                ->whereNotExists(fn ($query) => $query
                    ->selectRaw('1')
                    ->from('payouts')
                    ->whereColumn('payouts.hotel_id', 'hotels.id'))
                ->whereNotExists(fn ($query) => $query
                    ->selectRaw('1')
                    ->from('commission_rules')
                    ->whereColumn('commission_rules.hotel_id', 'hotels.id'))
                ->whereNotExists(fn ($query) => $query
                    ->selectRaw('1')
                    ->from('vouchers')
                    ->whereColumn('vouchers.hotel_id', 'hotels.id')),
            'mitra_onboardings_hotel' => DB::table('mitra_onboardings'),
            'event_tickets_unbooked_events' => DB::table('event_tickets')
                ->whereIn('event_id', $this->deletableEventIdsQuery()),
            'events_without_bookings' => DB::table('events')
                ->where('event_type', 'event')
                ->whereNotExists(fn ($query) => $query
                    ->selectRaw('1')
                    ->from('event_bookings')
                    ->whereColumn('event_bookings.event_id', 'events.id')),
            'event_settings' => DB::table('event_settings'),
            'mitra_event_staff' => DB::table('mitra_event_staff'),
            'mitra_event_onboardings' => DB::table('mitra_event_onboardings'),
            'event_organizers_without_retained_events' => DB::table('event_organizers')
                ->whereNotExists(fn ($query) => $query
                    ->selectRaw('1')
                    ->from('event_settlements')
                    ->whereColumn('event_settlements.event_organizer_id', 'event_organizers.id'))
                ->whereNotExists(fn ($query) => $query
                    ->selectRaw('1')
                    ->from('events')
                    ->whereColumn('events.event_organizer_id', 'event_organizers.id')
                    ->where(function ($events): void {
                        $events->where('event_type', '!=', 'event')
                            ->orWhereExists(fn ($bookings) => $bookings
                                ->selectRaw('1')
                                ->from('event_bookings')
                                ->whereColumn('event_bookings.event_id', 'events.id'));
                    })),
            'partner_terms_signatures_hotel_event' => DB::table('partner_terms_signatures')
                ->whereIn('business_type', ['hotel', 'event']),
            'partner_terms_documents_hotel_event' => DB::table('partner_terms_documents')
                ->whereIn('business_type', ['hotel', 'event']),
            'notification_triggers_hotel_event' => DB::table('notification_triggers')
                ->where(fn ($query) => $query
                    ->where('event_key', 'like', 'hotel_%')
                    ->orWhere('event_key', 'like', 'event_%')),
            'notification_templates_hotel_event' => DB::table('notification_templates')
                ->where(fn ($query) => $query
                    ->where('key', 'like', 'hotel_%')
                    ->orWhere('key', 'like', 'event_%')),
            'user_notifications_hotel_event' => DB::table('user_notifications')
                ->where(fn ($query) => $query
                    ->where('type', 'like', 'hotel_%')
                    ->orWhere('type', 'like', 'event_%')),
            'search_logs_hotel_event' => DB::table('search_logs')
                ->whereIn('product_type', ['hotel', 'hotels', 'event', 'events']),
            'system_settings_hotel_event' => DB::table('system_settings')
                ->whereIn('key', self::HOTEL_EVENT_SETTING_KEYS),
            'admin_permission_role_hotel_event' => DB::table('admin_permission_role')
                ->whereIn('admin_permission_id', $this->legacyAdminPermissionIdsQuery()),
            'admin_permissions_hotel_event' => DB::table('admin_permissions')
                ->whereIn('feature', self::LEGACY_PERMISSION_FEATURES),
            default => abort(500, 'Operasi cleanup tidak dikenal.'),
        };
    }

    private function deletableHotelIdsQuery(): \Illuminate\Database\Query\Builder
    {
        return DB::table('hotels')
            ->select('hotels.id')
            ->whereNotExists(fn ($query) => $query
                ->selectRaw('1')
                ->from('bookings')
                ->whereColumn('bookings.hotel_id', 'hotels.id'))
            ->whereNotExists(fn ($query) => $query
                ->selectRaw('1')
                ->from('payouts')
                ->whereColumn('payouts.hotel_id', 'hotels.id'))
            ->whereNotExists(fn ($query) => $query
                ->selectRaw('1')
                ->from('commission_rules')
                ->whereColumn('commission_rules.hotel_id', 'hotels.id'))
            ->whereNotExists(fn ($query) => $query
                ->selectRaw('1')
                ->from('vouchers')
                ->whereColumn('vouchers.hotel_id', 'hotels.id'));
    }

    private function roomTypeIdsForDeletableHotelsQuery(): \Illuminate\Database\Query\Builder
    {
        return DB::table('room_types')
            ->select('room_types.id')
            ->whereIn('hotel_id', $this->deletableHotelIdsQuery())
            ->whereNotExists(fn ($query) => $query
                ->selectRaw('1')
                ->from('booking_rooms')
                ->whereColumn('booking_rooms.room_type_id', 'room_types.id'));
    }

    private function deletableEventIdsQuery(): \Illuminate\Database\Query\Builder
    {
        return DB::table('events')
            ->select('events.id')
            ->where('event_type', 'event')
            ->whereNotExists(fn ($query) => $query
                ->selectRaw('1')
                ->from('event_bookings')
                ->whereColumn('event_bookings.event_id', 'events.id'));
    }

    private function deletableEventOrganizerIdsQuery(): \Illuminate\Database\Query\Builder
    {
        return DB::table('event_organizers')
            ->select('event_organizers.id')
            ->whereNotExists(fn ($query) => $query
                ->selectRaw('1')
                ->from('event_settlements')
                ->whereColumn('event_settlements.event_organizer_id', 'event_organizers.id'))
            ->whereNotExists(fn ($query) => $query
                ->selectRaw('1')
                ->from('events')
                ->whereColumn('events.event_organizer_id', 'event_organizers.id')
                ->where(function ($events): void {
                    $events->where('event_type', '!=', 'event')
                        ->orWhereExists(fn ($bookings) => $bookings
                            ->selectRaw('1')
                            ->from('event_bookings')
                            ->whereColumn('event_bookings.event_id', 'events.id'));
                }));
    }

    private function legacyProductReviewIdsQuery(): \Illuminate\Database\Query\Builder
    {
        return DB::table('product_reviews')
            ->select('id')
            ->whereIn('product_type', ['hotel', 'hotels', 'event', 'events']);
    }

    private function legacyAdminPermissionIdsQuery(): \Illuminate\Database\Query\Builder
    {
        return DB::table('admin_permissions')
            ->select('id')
            ->whereIn('feature', self::LEGACY_PERMISSION_FEATURES);
    }

    /**
     * @param  array<int, array<string, mixed>>  $plan
     * @return array<string, mixed>
     */
    private function summary(array $plan): array
    {
        $hotelRecords = collect($plan)
            ->filter(fn (array $item) => str_contains((string) $item['key'], 'hotel')
                || str_contains((string) $item['table'], 'room')
                || $item['table'] === 'mitra_onboardings')
            ->sum('records');
        $eventRecords = collect($plan)
            ->filter(fn (array $item) => str_contains((string) $item['key'], 'event')
                || str_contains((string) $item['table'], 'event'))
            ->sum('records');

        return [
            'records_candidate' => collect($plan)->sum('records'),
            'hotel_records' => $hotelRecords,
            'event_records' => $eventRecords,
            'legacy_records' => max(0, collect($plan)->sum('records') - $hotelRecords - $eventRecords),
            'operations' => count($plan),
            'operations_with_records' => collect($plan)->where('records', '>', 0)->count(),
            'financial_tables_retained' => [
                'bookings',
                'booking_rooms',
                'payments',
                'payouts',
                'payout_items',
                'commission_rules',
                'event_bookings',
                'event_payments',
                'event_refunds',
                'event_commissions',
                'event_settlements',
                'wisata_bookings',
                'wisata_payments',
                'wisata_payouts',
            ],
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $plan
     */
    private function signature(array $plan): string
    {
        return hash('sha256', json_encode(collect($plan)->map(fn (array $item) => [
            'key' => $item['key'],
            'table' => $item['table'],
            'records' => $item['records'],
        ])->all()));
    }

    /**
     * @param  array<int, array<string, mixed>>  $plan
     */
    private function backupCandidates(array $plan): string
    {
        $backup = [
            'created_at' => now()->toISOString(),
            'connection' => config('database.default'),
            'database' => config('database.connections.'.config('database.default').'.database'),
            'plan' => $plan,
            'tables' => [],
        ];

        foreach ($plan as $item) {
            if (($item['records'] ?? 0) < 1) {
                continue;
            }

            $backup['tables'][$item['table']] ??= [];
            $rows = (clone $this->candidateQuery($item['key']))->get()
                ->map(fn (object $row): array => (array) $row)
                ->all();
            $backup['tables'][$item['table']] = array_merge($backup['tables'][$item['table']], $rows);
        }

        $path = 'backups/database/indotix-legacy-cleanup-'.now()->format('Ymd-His').'-'.Str::lower(Str::random(8)).'.json';
        $written = Storage::disk('local')->put($path, json_encode($backup, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        if (! $written) {
            throw new \RuntimeException('Backup kandidat cleanup gagal dibuat.');
        }

        return $path;
    }

    /**
     * @param  array<string, mixed>  $summary
     */
    private function log(?int $adminId, string $mode, array $summary, ?string $backupPath, string $result): void
    {
        if (! Schema::hasTable('admin_audit_logs')) {
            return;
        }

        AdminAuditLog::query()->create([
            'admin_id' => $adminId,
            'action' => 'Legacy database cleanup '.$mode,
            'method' => 'CLI',
            'path' => 'artisan indotix:cleanup-legacy-database',
            'payload' => [
                'mode' => $mode,
                'environment' => app()->environment(),
                'summary' => $summary,
                'backup_path' => $backupPath,
                'result' => $result,
            ],
            'ip_address' => request()?->ip(),
            'user_agent' => substr((string) request()?->userAgent(), 0, 255),
        ]);
    }
}
