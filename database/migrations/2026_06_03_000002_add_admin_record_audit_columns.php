<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $tables = [
        'academy_classes',
        'academy_tickets',
        'blog_categories',
        'blog_posts',
        'blog_tags',
        'commission_rules',
        'events',
        'event_commissions',
        'event_organizers',
        'event_tickets',
        'faqs',
        'hotels',
        'notification_templates',
        'public_banners',
        'public_contacts',
        'public_partners',
        'room_inventories',
        'room_types',
        'souvenir_categories',
        'souvenir_products',
        'souvenir_promotions',
        'souvenir_variants',
        'special_programs',
        'special_program_variants',
        'system_settings',
        'users',
        'vouchers',
        'wisata_commission_rules',
        'wisata_tickets',
    ];

    private array $preexistingColumns = [
        'special_programs' => ['created_by', 'updated_by'],
        'souvenir_products' => ['created_by', 'updated_by'],
        'system_settings' => ['updated_by'],
    ];

    public function up(): void
    {
        foreach ($this->tables as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            if (! Schema::hasColumn($table, 'created_by')) {
                Schema::table($table, function (Blueprint $table) {
                    $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                });
            }

            if (! Schema::hasColumn($table, 'updated_by')) {
                Schema::table($table, function (Blueprint $table) {
                    $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                });
            }
        }
    }

    public function down(): void
    {
        foreach (array_reverse($this->tables) as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            if (
                Schema::hasColumn($table, 'updated_by')
                && ! in_array('updated_by', $this->preexistingColumns[$table] ?? [], true)
            ) {
                Schema::table($table, function (Blueprint $table) {
                    $table->dropConstrainedForeignId('updated_by');
                });
            }

            if (
                Schema::hasColumn($table, 'created_by')
                && ! in_array('created_by', $this->preexistingColumns[$table] ?? [], true)
            ) {
                Schema::table($table, function (Blueprint $table) {
                    $table->dropConstrainedForeignId('created_by');
                });
            }
        }
    }
};
