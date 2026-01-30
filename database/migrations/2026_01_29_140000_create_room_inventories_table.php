<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('room_inventories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('room_type_id')->constrained('room_types')->cascadeOnDelete();
            $table->date('date');
            $table->unsignedInteger('available_rooms');
            $table->decimal('price_override', 12, 2)->nullable();
            $table->boolean('is_closed')->default(false);
            $table->timestamps();

            $table->unique(['room_type_id', 'date']);
            $table->index(['date', 'is_closed']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('room_inventories');
    }
};
