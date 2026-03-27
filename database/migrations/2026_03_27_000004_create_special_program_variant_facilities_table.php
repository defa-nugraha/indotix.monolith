<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('special_program_variant_facilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('special_program_variant_id')
                ->constrained('special_program_variants')
                ->cascadeOnDelete();
            $table->text('content');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('special_program_variant_facilities');
    }
};
