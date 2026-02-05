<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('souvenir_orders', function (Blueprint $table) {
            $table->string('midtrans_order_id')->nullable()->unique()->after('payment_status');
            $table->string('snap_token')->nullable()->after('midtrans_order_id');
            $table->string('payment_type')->nullable()->after('snap_token');
            $table->string('transaction_id')->nullable()->after('payment_type');
            $table->json('payment_payload')->nullable()->after('transaction_id');
        });
    }

    public function down(): void
    {
        Schema::table('souvenir_orders', function (Blueprint $table) {
            $table->dropColumn([
                'midtrans_order_id',
                'snap_token',
                'payment_type',
                'transaction_id',
                'payment_payload',
            ]);
        });
    }
};
