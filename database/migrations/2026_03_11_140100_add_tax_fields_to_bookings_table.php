<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->unsignedBigInteger('service_fee')->default(0)->after('discount_amount');
            $table->unsignedBigInteger('tax_total')->default(0)->after('service_fee');
            $table->json('tax_details')->nullable()->after('tax_total');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['service_fee', 'tax_total', 'tax_details']);
        });
    }
};
