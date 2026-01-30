<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('mitra_onboardings')) {
            return;
        }

        if (! Schema::hasColumn('mitra_onboardings', 'city_code')) {
            Schema::table('mitra_onboardings', function (Blueprint $table) {
                $table->char('city_code', 4)->nullable()->after('property_type');
            });
        }

        $indexExists = DB::select(
            "SHOW INDEX FROM mitra_onboardings WHERE Key_name = 'mitra_onboardings_city_code_index'"
        );

        if (empty($indexExists)) {
            Schema::table('mitra_onboardings', function (Blueprint $table) {
                $table->index('city_code', 'mitra_onboardings_city_code_index');
            });
        }

        $schema = DB::getDatabaseName();
        $fkExists = DB::select(
            'SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME = ?',
            [$schema, 'mitra_onboardings', 'mitra_onboardings_city_code_foreign']
        );

        if (empty($fkExists)) {
            Schema::table('mitra_onboardings', function (Blueprint $table) {
                $table->foreign('city_code', 'mitra_onboardings_city_code_foreign')
                    ->references('code')
                    ->on('regencies')
                    ->cascadeOnUpdate()
                    ->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('mitra_onboardings')) {
            return;
        }

        $schema = DB::getDatabaseName();
        $fkExists = DB::select(
            'SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME = ?',
            [$schema, 'mitra_onboardings', 'mitra_onboardings_city_code_foreign']
        );

        if (! empty($fkExists)) {
            Schema::table('mitra_onboardings', function (Blueprint $table) {
                $table->dropForeign('mitra_onboardings_city_code_foreign');
            });
        }

        $indexExists = DB::select(
            "SHOW INDEX FROM mitra_onboardings WHERE Key_name = 'mitra_onboardings_city_code_index'"
        );

        if (! empty($indexExists)) {
            Schema::table('mitra_onboardings', function (Blueprint $table) {
                $table->dropIndex('mitra_onboardings_city_code_index');
            });
        }
    }
};
