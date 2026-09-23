<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $tables = [
        'commission_rules',
        'blog_categories',
        'blog_posts',
        'blog_tags',
        'faqs',
        'hotels',
        'notification_templates',
        'public_banners',
        'public_contacts',
        'public_partners',
        'room_inventories',
        'room_types',
        'system_settings',
        'users',
        'vouchers',
        'wisata_commission_rules',
        'wisata_tickets',
    ];

    private array $preexistingColumns = [
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
