<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('special_program_variant_facilities', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('special_program_variant_id');
            $table->text('content');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->foreign(
                'special_program_variant_id',
                'sp_variant_facilities_variant_fk',
            )->references('id')->on('special_program_variants')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('special_program_variant_facilities');
    }
};
