<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_rooms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->foreignId('room_type_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('rooms_count');
            $table->unsignedBigInteger('price_per_night');
            $table->unsignedBigInteger('subtotal');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_rooms');
    }
};
