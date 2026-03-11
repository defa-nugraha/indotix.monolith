<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hotel_taxes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hotel_id')->constrained('hotels')->cascadeOnDelete();
            $table->string('name', 120);
            $table->decimal('rate', 6, 2)->default(0);
            $table->timestamps();

            $table->index(['hotel_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hotel_taxes');
    }
};
