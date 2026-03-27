<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('special_program_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('special_program_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->unsignedBigInteger('price')->nullable();
            $table->unsignedInteger('capacity')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('special_program_variants');
    }
};
