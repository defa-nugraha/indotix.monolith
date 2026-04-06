<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->unsignedInteger('children_count')->default(0)->after('guests_count');
            $table->json('children_ages')->nullable()->after('children_count');
            $table->unsignedInteger('extra_adults')->default(0)->after('children_ages');
            $table->unsignedInteger('extra_children')->default(0)->after('extra_adults');
            $table->unsignedInteger('extra_beds')->default(0)->after('extra_children');
            $table->unsignedBigInteger('extra_adult_fee')->default(0)->after('extra_beds');
            $table->unsignedBigInteger('extra_child_fee')->default(0)->after('extra_adult_fee');
            $table->unsignedBigInteger('extra_bed_fee')->default(0)->after('extra_child_fee');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn([
                'children_count',
                'children_ages',
                'extra_adults',
                'extra_children',
                'extra_beds',
                'extra_adult_fee',
                'extra_child_fee',
                'extra_bed_fee',
            ]);
        });
    }
};
