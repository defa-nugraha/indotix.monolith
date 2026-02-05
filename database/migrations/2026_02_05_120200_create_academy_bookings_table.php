<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('academy_bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('academy_class_id')->constrained('academy_classes')->cascadeOnDelete();
            $table->foreignId('academy_ticket_id')->constrained('academy_tickets')->cascadeOnDelete();
            $table->string('booking_code')->unique();
            $table->unsignedInteger('quantity')->default(1);
            $table->unsignedInteger('total_price')->default(0);
            $table->enum('status', ['pending_payment', 'paid', 'cancelled', 'expired', 'completed'])->default('pending_payment');
            $table->string('payment_status')->default('pending');
            $table->dateTime('payment_deadline')->nullable();
            $table->string('guest_name')->nullable();
            $table->string('guest_email')->nullable();
            $table->string('guest_phone')->nullable();
            $table->string('midtrans_order_id')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('academy_bookings');
    }
};
