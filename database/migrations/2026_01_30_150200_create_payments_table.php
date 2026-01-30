<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->string('provider')->default('midtrans');
            $table->string('status')->default('pending');
            $table->unsignedBigInteger('gross_amount');
            $table->string('payment_type')->nullable();
            $table->string('transaction_id')->nullable();
            $table->string('order_id')->nullable()->index();
            $table->json('payload')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
