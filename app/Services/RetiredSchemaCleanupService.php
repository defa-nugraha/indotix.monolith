<?php

namespace App\Services;

use App\Models\AdminAuditLog;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class RetiredSchemaCleanupService
{
    public const CONFIRMATION = 'DROP_RETIRED_SCHEMA';

    private const PLAN_CACHE_PREFIX = 'retired_schema_cleanup_plan:';

    /**
     * @return array<string, mixed>
     */
    public function preview(int $adminId): array
    {
        $plan = $this->buildPlan();
        $summary = $this->summary($plan);
        $planId = hash('sha256', Str::uuid()->toString().json_encode($summary).microtime(true));

        Cache::put(self::PLAN_CACHE_PREFIX.$planId, [
            'signature' => $this->signature($plan),
            'admin_id' => $adminId,
            'created_at' => now()->toISOString(),
        ], now()->addMinutes(30));

        $this->log($adminId, 'preview', $summary, null, 'success');

        return [
            'success' => true,
            'mode' => 'preview',
            'message' => 'Retired schema cleanup preview generated.',
            'cleanup_plan_id' => $planId,
            'confirmation_required' => self::CONFIRMATION,
            'summary' => $summary,
            'cleanup_plan' => $plan,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function execute(string $planId, int $adminId, bool $allowNonEmpty = false): array
    {
        $cached = Cache::get(self::PLAN_CACHE_PREFIX.$planId);
        if (! is_array($cached)) {
            abort(422, 'Preview schema cleanup tidak ditemukan atau sudah kedaluwarsa.');
        }

        $plan = $this->buildPlan();

        if (($cached['signature'] ?? null) !== $this->signature($plan)) {
            abort(409, 'Schema berubah setelah preview dibuat. Jalankan preview ulang sebelum execute.');
        }

        $nonEmptyTables = collect($plan)
            ->filter(fn (array $item): bool => ($item['records'] ?? 0) > 0)
            ->pluck('table')
            ->values()
            ->all();

        if ($nonEmptyTables !== [] && ! $allowNonEmpty) {
            abort(422, 'Execute diblokir karena ada tabel retired berisi data: '.implode(', ', $nonEmptyTables).'. Tambahkan --allow-non-empty hanya setelah backup database eksternal dibuat.');
        }

        $backupPath = $this->backupTables($plan);
        $dropped = [];
        $failed = [];

        $this->withoutForeignKeyChecks(function () use ($plan, &$dropped, &$failed): void {
            foreach ($plan as $item) {
                $table = (string) $item['table'];

                if (! Schema::hasTable($table)) {
                    continue;
                }

                try {
                    Schema::dropIfExists($table);
                    $dropped[] = $table;
                } catch (\Throwable $exception) {
                    $failed[$table] = $exception->getMessage();
                    throw $exception;
                }
            }
        });

        Cache::forget(self::PLAN_CACHE_PREFIX.$planId);

        $summary = [
            'tables_dropped' => count($dropped),
            'dropped_tables' => $dropped,
            'failed_tables' => $failed,
            'backup_path' => $backupPath,
        ];

        $this->log($adminId, 'execute', $summary, $backupPath, 'success');

        return [
            'success' => true,
            'mode' => 'execute',
            'message' => 'Retired schema cleanup completed successfully.',
            'summary' => $summary,
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function buildPlan(): array
    {
        return collect($this->retiredTables())
            ->filter(fn (array $item): bool => Schema::hasTable($item['table']))
            ->map(function (array $item): array {
                return [
                    'table' => $item['table'],
                    'module' => $item['module'],
                    'risk' => $item['risk'],
                    'reason' => $item['reason'],
                    'records' => DB::table($item['table'])->count(),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * Tables are ordered children first so cleanup also works without disabling
     * foreign key checks on database engines that allow ordered drops.
     *
     * @return array<int, array{table: string, module: string, risk: string, reason: string}>
     */
    protected function retiredTables(): array
    {
        return [
            ['table' => 'academy_refunds', 'module' => 'academy', 'risk' => 'HIGH', 'reason' => 'Retired Academy refund history.'],
            ['table' => 'academy_payments', 'module' => 'academy', 'risk' => 'HIGH', 'reason' => 'Retired Academy payment history.'],
            ['table' => 'academy_scans', 'module' => 'academy', 'risk' => 'MEDIUM', 'reason' => 'Retired Academy QR scan data.'],
            ['table' => 'academy_attendees', 'module' => 'academy', 'risk' => 'MEDIUM', 'reason' => 'Retired Academy attendee data.'],
            ['table' => 'academy_bookings', 'module' => 'academy', 'risk' => 'HIGH', 'reason' => 'Retired Academy booking history.'],
            ['table' => 'academy_tickets', 'module' => 'academy', 'risk' => 'MEDIUM', 'reason' => 'Retired Academy ticket catalog.'],
            ['table' => 'academy_class_images', 'module' => 'academy', 'risk' => 'LOW', 'reason' => 'Retired Academy media records.'],
            ['table' => 'academy_classes', 'module' => 'academy', 'risk' => 'MEDIUM', 'reason' => 'Retired Academy class catalog.'],
            ['table' => 'academy_audit_logs', 'module' => 'academy', 'risk' => 'MEDIUM', 'reason' => 'Retired Academy audit data.'],
            ['table' => 'academy_settings', 'module' => 'academy', 'risk' => 'LOW', 'reason' => 'Retired Academy configuration.'],

            ['table' => 'souvenir_refunds', 'module' => 'retail', 'risk' => 'HIGH', 'reason' => 'Retired retail refund history.'],
            ['table' => 'souvenir_order_items', 'module' => 'retail', 'risk' => 'HIGH', 'reason' => 'Retired retail order item history.'],
            ['table' => 'souvenir_orders', 'module' => 'retail', 'risk' => 'HIGH', 'reason' => 'Retired retail order history.'],
            ['table' => 'souvenir_stock_movements', 'module' => 'retail', 'risk' => 'MEDIUM', 'reason' => 'Retired retail stock movements.'],
            ['table' => 'souvenir_product_images', 'module' => 'retail', 'risk' => 'LOW', 'reason' => 'Retired retail media records.'],
            ['table' => 'souvenir_promotions', 'module' => 'retail', 'risk' => 'LOW', 'reason' => 'Retired retail promotions.'],
            ['table' => 'souvenir_variants', 'module' => 'retail', 'risk' => 'LOW', 'reason' => 'Retired retail variants.'],
            ['table' => 'souvenir_products', 'module' => 'retail', 'risk' => 'MEDIUM', 'reason' => 'Retired retail product catalog.'],
            ['table' => 'souvenir_categories', 'module' => 'retail', 'risk' => 'LOW', 'reason' => 'Retired retail categories.'],
            ['table' => 'souvenir_audit_logs', 'module' => 'retail', 'risk' => 'MEDIUM', 'reason' => 'Retired retail audit data.'],

            ['table' => 'event_disputes', 'module' => 'event', 'risk' => 'HIGH', 'reason' => 'Retired Event dispute history.'],
            ['table' => 'event_payments', 'module' => 'event', 'risk' => 'HIGH', 'reason' => 'Retired Event payment history.'],
            ['table' => 'event_refunds', 'module' => 'event', 'risk' => 'HIGH', 'reason' => 'Retired Event refund history.'],
            ['table' => 'event_scans', 'module' => 'event', 'risk' => 'MEDIUM', 'reason' => 'Retired Event scan data.'],
            ['table' => 'event_attendees', 'module' => 'event', 'risk' => 'MEDIUM', 'reason' => 'Retired Event attendee data.'],
            ['table' => 'event_bookings', 'module' => 'event', 'risk' => 'HIGH', 'reason' => 'Retired Event booking history.'],
            ['table' => 'event_tickets', 'module' => 'event', 'risk' => 'MEDIUM', 'reason' => 'Retired Event ticket catalog.'],
            ['table' => 'event_settlements', 'module' => 'event', 'risk' => 'HIGH', 'reason' => 'Retired Event settlement history.'],
            ['table' => 'event_commissions', 'module' => 'event', 'risk' => 'MEDIUM', 'reason' => 'Retired Event commission rules.'],
            ['table' => 'events', 'module' => 'event', 'risk' => 'MEDIUM', 'reason' => 'Retired Event catalog.'],
            ['table' => 'event_organizers', 'module' => 'event', 'risk' => 'MEDIUM', 'reason' => 'Retired Event organizer data.'],
            ['table' => 'event_audit_logs', 'module' => 'event', 'risk' => 'MEDIUM', 'reason' => 'Retired Event audit data.'],
            ['table' => 'event_settings', 'module' => 'event', 'risk' => 'LOW', 'reason' => 'Retired Event configuration.'],
            ['table' => 'mitra_event_staff', 'module' => 'event', 'risk' => 'MEDIUM', 'reason' => 'Retired Event staff assignments.'],
            ['table' => 'mitra_event_onboardings', 'module' => 'event', 'risk' => 'MEDIUM', 'reason' => 'Retired Event partner onboarding.'],

            ['table' => 'payments', 'module' => 'hotel', 'risk' => 'HIGH', 'reason' => 'Retired Hotel payment history.'],
            ['table' => 'payout_items', 'module' => 'hotel', 'risk' => 'HIGH', 'reason' => 'Retired Hotel payout item history.'],
            ['table' => 'payouts', 'module' => 'hotel', 'risk' => 'HIGH', 'reason' => 'Retired Hotel payout history.'],
            ['table' => 'booking_rooms', 'module' => 'hotel', 'risk' => 'HIGH', 'reason' => 'Retired Hotel booking room history.'],
            ['table' => 'bookings', 'module' => 'hotel', 'risk' => 'HIGH', 'reason' => 'Retired Hotel booking history.'],
            ['table' => 'commission_rules', 'module' => 'hotel', 'risk' => 'MEDIUM', 'reason' => 'Retired Hotel commission rules.'],
            ['table' => 'room_inventories', 'module' => 'hotel', 'risk' => 'LOW', 'reason' => 'Retired Hotel room inventory.'],
            ['table' => 'room_images', 'module' => 'hotel', 'risk' => 'LOW', 'reason' => 'Retired Hotel room media records.'],
            ['table' => 'hotel_images', 'module' => 'hotel', 'risk' => 'LOW', 'reason' => 'Retired Hotel media records.'],
            ['table' => 'hotel_taxes', 'module' => 'hotel', 'risk' => 'LOW', 'reason' => 'Retired Hotel tax configuration.'],
            ['table' => 'hotel_facilities', 'module' => 'hotel', 'risk' => 'LOW', 'reason' => 'Retired Hotel facilities.'],
            ['table' => 'room_types', 'module' => 'hotel', 'risk' => 'MEDIUM', 'reason' => 'Retired Hotel room catalog.'],
            ['table' => 'hotels', 'module' => 'hotel', 'risk' => 'MEDIUM', 'reason' => 'Retired Hotel catalog.'],
            ['table' => 'mitra_onboardings', 'module' => 'hotel', 'risk' => 'MEDIUM', 'reason' => 'Retired Hotel partner onboarding.'],
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $plan
     * @return array<string, mixed>
     */
    private function summary(array $plan): array
    {
        $byModule = collect($plan)
            ->groupBy('module')
            ->map(fn ($items): array => [
                'tables' => $items->count(),
                'records' => $items->sum('records'),
            ])
            ->all();

        return [
            'tables_candidate' => count($plan),
            'records_in_candidate_tables' => collect($plan)->sum('records'),
            'non_empty_tables' => collect($plan)->where('records', '>', 0)->pluck('table')->values()->all(),
            'by_module' => $byModule,
            'migration_rows_retained' => true,
            'warning' => 'Tabel di-drop, tetapi row migrations dipertahankan agar php artisan migrate tidak membuat ulang retired schema.',
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $plan
     */
    private function signature(array $plan): string
    {
        return hash('sha256', json_encode(collect($plan)->map(fn (array $item): array => [
            'table' => $item['table'],
            'records' => $item['records'],
        ])->all()));
    }

    /**
     * @param  array<int, array<string, mixed>>  $plan
     */
    private function backupTables(array $plan): string
    {
        $backup = [
            'created_at' => now()->toISOString(),
            'connection' => config('database.default'),
            'database' => config('database.connections.'.config('database.default').'.database'),
            'plan' => $plan,
            'tables' => [],
        ];

        foreach ($plan as $item) {
            $table = (string) $item['table'];
            $backup['tables'][$table] = DB::table($table)->get()
                ->map(fn (object $row): array => (array) $row)
                ->all();
        }

        $path = 'backups/database/indotix-retired-schema-drop-'.now()->format('Ymd-His').'-'.Str::lower(Str::random(8)).'.json';
        $written = Storage::disk('local')->put($path, json_encode($backup, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        if (! $written) {
            throw new \RuntimeException('Backup tabel retired schema gagal dibuat.');
        }

        return $path;
    }

    private function withoutForeignKeyChecks(callable $callback): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement('SET FOREIGN_KEY_CHECKS=0');
        } elseif ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF');
        }

        try {
            $callback();
        } finally {
            if ($driver === 'mysql') {
                DB::statement('SET FOREIGN_KEY_CHECKS=1');
            } elseif ($driver === 'sqlite') {
                DB::statement('PRAGMA foreign_keys = ON');
            }
        }
    }

    /**
     * @param  array<string, mixed>  $summary
     */
    private function log(int $adminId, string $mode, array $summary, ?string $backupPath, string $result): void
    {
        if (! Schema::hasTable('admin_audit_logs')) {
            return;
        }

        AdminAuditLog::query()->create([
            'admin_id' => $adminId,
            'action' => 'Retired schema cleanup '.$mode,
            'method' => 'CLI',
            'path' => 'artisan indotix:drop-retired-schema',
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
