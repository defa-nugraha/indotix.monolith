<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('hotel_id')->constrained()->cascadeOnDelete();
            $table->date('check_in');
            $table->date('check_out');
            $table->unsignedInteger('nights');
            $table->unsignedInteger('rooms_count');
            $table->unsignedInteger('guests_count');
            $table->string('currency', 8)->default('IDR');
            $table->unsignedBigInteger('subtotal');
            $table->unsignedBigInteger('total');
            $table->enum('status', ['draft', 'pending_payment', 'paid', 'expired', 'cancelled', 'completed'])->default('pending_payment');
            $table->timestamp('payment_deadline')->nullable();
            $table->string('guest_name')->nullable();
            $table->string('guest_email')->nullable();
            $table->string('guest_phone')->nullable();
            $table->text('special_request')->nullable();
            $table->string('midtrans_order_id')->nullable()->index();
            $table->string('payment_status')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
