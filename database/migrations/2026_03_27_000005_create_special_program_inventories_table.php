<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('special_program_inventories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('special_program_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->unsignedInteger('capacity')->default(0);
            $table->timestamps();

            $table->unique(['special_program_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('special_program_inventories');
    }
};
