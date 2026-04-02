<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_addresses', function (Blueprint $table) {
            $table->char('province_code', 2)->nullable()->after('province');
            $table->char('city_code', 4)->nullable()->after('city');
            $table->char('district_code', 6)->nullable()->after('district');
            $table->char('village_code', 10)->nullable()->after('village');
        });
    }

    public function down(): void
    {
        Schema::table('user_addresses', function (Blueprint $table) {
            $table->dropColumn([
                'province_code',
                'city_code',
                'district_code',
                'village_code',
            ]);
        });
    }
};
