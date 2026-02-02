<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('wisata_bookings', function (Blueprint $table) {
            $table->string('guest_name')->nullable()->after('status');
            $table->string('guest_email')->nullable()->after('guest_name');
            $table->string('guest_phone')->nullable()->after('guest_email');
            $table->string('special_request', 1000)->nullable()->after('guest_phone');
            $table->string('payment_status')->nullable()->after('special_request');
            $table->timestamp('payment_deadline')->nullable()->after('payment_status');
            $table->string('midtrans_order_id')->nullable()->after('payment_deadline');
        });
    }

    public function down(): void
    {
        Schema::table('wisata_bookings', function (Blueprint $table) {
            $table->dropColumn([
                'guest_name',
                'guest_email',
                'guest_phone',
                'special_request',
                'payment_status',
                'payment_deadline',
                'midtrans_order_id',
            ]);
        });
    }
};
