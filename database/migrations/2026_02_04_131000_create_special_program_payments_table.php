<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('special_program_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('special_program_booking_id')->constrained()->cascadeOnDelete();
            $table->string('provider')->default('midtrans');
            $table->string('status')->default('pending');
            $table->unsignedInteger('gross_amount')->default(0);
            $table->string('payment_type')->nullable();
            $table->string('transaction_id')->nullable();
            $table->string('order_id')->nullable();
            $table->json('payload')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('special_program_payments');
    }
};
