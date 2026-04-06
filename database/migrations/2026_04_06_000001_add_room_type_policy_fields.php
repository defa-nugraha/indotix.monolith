<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('room_types', function (Blueprint $table) {
            $table->unsignedInteger('included_adults')->default(2)->after('max_guest');
            $table->unsignedInteger('extra_bed_max')->default(0)->after('included_adults');
            $table->unsignedBigInteger('extra_bed_price')->default(0)->after('extra_bed_max');
            $table->unsignedBigInteger('extra_adult_price')->default(0)->after('extra_bed_price');
            $table->unsignedBigInteger('extra_child_price')->default(0)->after('extra_adult_price');
            $table->unsignedTinyInteger('child_age_max')->default(12)->after('extra_child_price');
        });
    }

    public function down(): void
    {
        Schema::table('room_types', function (Blueprint $table) {
            $table->dropColumn([
                'included_adults',
                'extra_bed_max',
                'extra_bed_price',
                'extra_adult_price',
                'extra_child_price',
                'child_age_max',
            ]);
        });
    }
};
