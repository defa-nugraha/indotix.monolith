<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('commission_rules', function (Blueprint $table) {
            $table->boolean('is_forever')->default(false)->after('ends_at');
        });

        Schema::table('wisata_commission_rules', function (Blueprint $table) {
            $table->boolean('is_forever')->default(false)->after('end_date');
        });

        Schema::table('event_commissions', function (Blueprint $table) {
            $table->boolean('is_forever')->default(false)->after('ends_at');
        });

        DB::table('commission_rules')
            ->whereNull('starts_at')
            ->whereNull('ends_at')
            ->update(['is_forever' => true]);

        DB::table('wisata_commission_rules')
            ->whereNull('start_date')
            ->whereNull('end_date')
            ->update(['is_forever' => true]);

        DB::table('event_commissions')
            ->whereNull('starts_at')
            ->whereNull('ends_at')
            ->update(['is_forever' => true]);
    }

    public function down(): void
    {
        Schema::table('commission_rules', function (Blueprint $table) {
            $table->dropColumn('is_forever');
        });

        Schema::table('wisata_commission_rules', function (Blueprint $table) {
            $table->dropColumn('is_forever');
        });

        Schema::table('event_commissions', function (Blueprint $table) {
            $table->dropColumn('is_forever');
        });
    }
};
