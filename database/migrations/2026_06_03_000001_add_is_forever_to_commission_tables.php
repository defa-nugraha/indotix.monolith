<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('wisata_commission_rules', function (Blueprint $table) {
            $table->boolean('is_forever')->default(false)->after('end_date');
        });

        DB::table('wisata_commission_rules')
            ->whereNull('start_date')
            ->whereNull('end_date')
            ->update(['is_forever' => true]);
    }

    public function down(): void
    {
        Schema::table('wisata_commission_rules', function (Blueprint $table) {
            $table->dropColumn('is_forever');
        });
    }
};
