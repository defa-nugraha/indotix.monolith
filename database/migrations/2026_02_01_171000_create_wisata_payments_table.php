<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('wisata_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wisata_booking_id')->constrained('wisata_bookings')->cascadeOnDelete();
            $table->string('provider')->default('midtrans');
            $table->string('status')->default('pending');
            $table->unsignedInteger('gross_amount')->default(0);
            $table->string('payment_type')->nullable();
            $table->string('transaction_id')->nullable();
            $table->string('order_id')->unique();
            $table->json('payload')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wisata_payments');
    }
};
