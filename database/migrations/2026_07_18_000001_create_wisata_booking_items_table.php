<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('wisata_booking_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wisata_booking_id')
                ->constrained('wisata_bookings')
                ->cascadeOnDelete();
            $table->foreignId('wisata_ticket_id')
                ->constrained('wisata_tickets')
                ->cascadeOnDelete();
            $table->string('ticket_name')->nullable();
            $table->unsignedInteger('quantity')->default(1);
            $table->unsignedInteger('unit_price')->default(0);
            $table->unsignedInteger('subtotal')->default(0);
            $table->timestamps();

            $table->index(['wisata_ticket_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wisata_booking_items');
    }
};
