<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class SystemResetService
{
    private const ADMIN_ROLES = [
        'admin',
        'admin_academy',
        'admin_retail',
        'admin_special_program',
    ];

    private const PROTECTED_TABLES = [
        'admin_permission_role',
        'admin_permissions',
        'admin_roles',
        'districts',
        'migrations',
        'provinces',
        'regencies',
        'sessions',
        'system_settings',
        'users',
        'villages',
    ];

    private const RESET_SECTIONS = [
        'users' => [
            'label' => 'User & Mitra',
            'description' => 'Akun user biasa, akun mitra, dan data yang bergantung pada akun tersebut.',
            'tables' => [],
            'prefixes' => [],
        ],
        'hotel' => [
            'label' => 'Hotel',
            'description' => 'Hotel, kamar, inventori, booking hotel, pembayaran hotel, komisi, dan payout hotel.',
            'tables' => [
                'booking_audit_logs',
                'booking_rooms',
                'bookings',
                'commission_rules',
                'hotel_images',
                'hotel_taxes',
                'hotels',
                'mitra_onboardings',
                'payments',
                'payout_items',
                'payouts',
                'room_inventories',
                'room_types',
            ],
            'prefixes' => [],
        ],
        'wisata' => [
            'label' => 'Wisata',
            'description' => 'Destinasi wisata, tiket, booking, pembayaran, komisi, afiliasi, payout, review, dan dispute wisata.',
            'tables' => [
                'mitra_wisata_onboardings',
                'mitra_wisata_staff',
                'wisata_affiliates',
                'wisata_affiliate_commission_items',
                'wisata_affiliate_commissions',
                'wisata_affiliate_links',
                'wisata_affiliate_payouts',
                'wisata_bookings',
                'wisata_commission_rules',
                'wisata_disputes',
                'wisata_payments',
                'wisata_payouts',
                'wisata_reviews',
                'wisata_ticket_scans',
                'wisata_tickets',
            ],
            'prefixes' => [],
        ],
        'event' => [
            'label' => 'Event',
            'description' => 'Organizer, event, tiket, booking, attendee, pembayaran, komisi, settlement, dan audit event.',
            'tables' => [
                'event_attendees',
                'event_audit_logs',
                'event_bookings',
                'event_commissions',
                'event_disputes',
                'event_organizers',
                'event_payments',
                'event_refunds',
                'event_scans',
                'event_settings',
                'event_settlements',
                'event_tickets',
                'events',
                'mitra_event_onboardings',
                'mitra_event_staff',
            ],
            'prefixes' => [],
        ],
        'academy' => [
            'label' => 'Academy',
            'description' => 'Kelas academy, tiket, booking, attendee, pembayaran, refund, scan, audit, dan pengaturan academy.',
            'tables' => [],
            'prefixes' => ['academy_'],
        ],
        'special_programs' => [
            'label' => 'Special Program',
            'description' => 'Program khusus, varian, inventory, booking, attendee, pembayaran, scan, fasilitas, dan item special program.',
            'tables' => ['special_programs'],
            'prefixes' => ['special_program_'],
        ],
        'retail' => [
            'label' => 'Retail Shop',
            'description' => 'Produk souvenir, kategori, varian, gambar, stok, order, refund, promosi, dan audit retail.',
            'tables' => [],
            'prefixes' => ['souvenir_'],
        ],
        'content' => [
            'label' => 'Konten Publik',
            'description' => 'Banner, promo, blog, FAQ, halaman publik, kontak, partner, voucher, dan review produk.',
            'tables' => [
                'about_pages',
                'blog_categories',
                'blog_post_tag',
                'blog_posts',
                'blog_tags',
                'faqs',
                'privacy_policies',
                'product_review_media',
                'product_reviews',
                'promo_items',
                'promo_videos',
                'public_banners',
                'public_contacts',
                'public_partners',
                'vouchers',
            ],
            'prefixes' => [],
        ],
        'activity' => [
            'label' => 'Aktivitas Sistem',
            'description' => 'Audit log, chat, notifikasi, OTP, token perangkat, personal access token, search log, job queue, dan alamat user.',
            'tables' => [
                'admin_audit_logs',
                'chat_conversations',
                'chat_messages',
                'email_otps',
                'failed_jobs',
                'job_batches',
                'jobs',
                'notification_templates',
                'notification_triggers',
                'password_reset_tokens',
                'personal_access_tokens',
                'search_logs',
                'user_addresses',
                'user_device_tokens',
                'user_notifications',
            ],
            'prefixes' => [],
        ],
        'uploads' => [
            'label' => 'File Upload',
            'description' => 'Semua folder file di storage publik.',
            'tables' => [],
            'prefixes' => [],
        ],
    ];

    /**
     * @param  array<int, string>|null  $sections
     * @return array{sections:array<int, string>, tables_reset:int, users_deleted:int, upload_directories_deleted:int}
     */
    public function reset(?array $sections = null): array
    {
        $sections = $this->normalizeSections($sections);
        $tables = $this->tablesForSections($sections);

        $this->withoutForeignKeyChecks(function () use ($tables): void {
            foreach ($tables as $table) {
                DB::table($table)->truncate();
            }
        });

        $usersDeleted = in_array('users', $sections, true)
            ? DB::table('users')
                ->whereNull('admin_role_id')
                ->whereNotIn('role', self::ADMIN_ROLES)
                ->delete()
            : 0;

        $directoriesDeleted = in_array('uploads', $sections, true)
            ? $this->deletePublicUploads()
            : 0;

        return [
            'sections' => $sections,
            'tables_reset' => count($tables),
            'users_deleted' => $usersDeleted,
            'upload_directories_deleted' => $directoriesDeleted,
        ];
    }

    /**
     * @return array{admin_users:int, resettable_tables:int, upload_directories:int, sections:array<int, array{key:string,label:string,description:string,tables_count:int}>}
     */
    public function stats(): array
    {
        return [
            'admin_users' => DB::table('users')
                ->where(function ($query): void {
                    $query->whereIn('role', self::ADMIN_ROLES)
                        ->orWhereNotNull('admin_role_id');
                })
                ->count(),
            'resettable_tables' => count($this->resettableTables()),
            'upload_directories' => count(Storage::disk('public')->directories()),
            'sections' => collect(self::RESET_SECTIONS)
                ->map(fn (array $section, string $key): array => [
                    'key' => $key,
                    'label' => $section['label'],
                    'description' => $section['description'],
                    'tables_count' => count($this->tablesForSections([$key])),
                ])
                ->values()
                ->all(),
        ];
    }

    /**
     * @return array<int, string>
     */
    public function sectionKeys(): array
    {
        return array_keys(self::RESET_SECTIONS);
    }

    /**
     * @return array<int, string>
     */
    private function resettableTables(): array
    {
        $protected = array_flip(self::PROTECTED_TABLES);

        return collect($this->currentDatabaseTables())
            ->reject(fn (string $table): bool => isset($protected[$table]))
            ->values()
            ->all();
    }

    /**
     * @param  array<int, string>|null  $sections
     * @return array<int, string>
     */
    private function normalizeSections(?array $sections): array
    {
        $allowed = array_flip($this->sectionKeys());
        $sections = $sections ?: $this->sectionKeys();

        return collect($sections)
            ->filter(fn ($section): bool => is_string($section) && isset($allowed[$section]))
            ->unique()
            ->values()
            ->all();
    }

    /**
     * @param  array<int, string>  $sections
     * @return array<int, string>
     */
    private function tablesForSections(array $sections): array
    {
        $existing = collect($this->currentDatabaseTables());
        $protected = array_flip(self::PROTECTED_TABLES);
        $selected = collect($sections)
            ->flatMap(function (string $key): array {
                $section = self::RESET_SECTIONS[$key] ?? ['tables' => [], 'prefixes' => []];
                $tables = $section['tables'] ?? [];
                $prefixes = $section['prefixes'] ?? [];

                if ($prefixes === []) {
                    return $tables;
                }

                $prefixedTables = collect($this->currentDatabaseTables())
                    ->filter(fn (string $table): bool => collect($prefixes)
                        ->contains(fn (string $prefix): bool => str_starts_with($table, $prefix)))
                    ->values()
                    ->all();

                return [...$tables, ...$prefixedTables];
            })
            ->unique()
            ->values();

        return $existing
            ->intersect($selected)
            ->reject(fn (string $table): bool => isset($protected[$table]))
            ->values()
            ->all();
    }

    /**
     * @return array<int, string>
     */
    private function currentDatabaseTables(): array
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql' || $driver === 'mariadb') {
            return collect(DB::select(
                'select table_name from information_schema.tables where table_schema = ? order by table_name',
                [DB::getDatabaseName()],
            ))
                ->map(fn (object $row): string => $row->TABLE_NAME ?? $row->table_name)
                ->values()
                ->all();
        }

        if ($driver === 'pgsql') {
            return collect(DB::select(
                "select tablename as table_name from pg_tables where schemaname = 'public' order by tablename",
            ))
                ->map(fn (object $row): string => $row->table_name)
                ->values()
                ->all();
        }

        if ($driver === 'sqlite') {
            return collect(DB::select(
                "select name as table_name from sqlite_master where type = 'table' and name not like 'sqlite_%' order by name",
            ))
                ->map(fn (object $row): string => $row->table_name)
                ->values()
                ->all();
        }

        return [];
    }

    private function withoutForeignKeyChecks(callable $callback): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql' || $driver === 'mariadb') {
            DB::statement('SET FOREIGN_KEY_CHECKS=0');
            try {
                $callback();
            } finally {
                DB::statement('SET FOREIGN_KEY_CHECKS=1');
            }

            return;
        }

        if ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF');
            try {
                $callback();
            } finally {
                DB::statement('PRAGMA foreign_keys = ON');
            }

            return;
        }

        if ($driver === 'pgsql') {
            DB::statement('SET session_replication_role = replica');
            try {
                $callback();
            } finally {
                DB::statement('SET session_replication_role = DEFAULT');
            }

            return;
        }

        $callback();
    }

    private function deletePublicUploads(): int
    {
        $disk = Storage::disk('public');
        $deleted = 0;

        foreach ($disk->directories() as $directory) {
            if ($disk->deleteDirectory($directory)) {
                $deleted++;
            }
        }

        return $deleted;
    }
}
