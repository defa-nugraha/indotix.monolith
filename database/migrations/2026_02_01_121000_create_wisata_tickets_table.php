<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('wisata_tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mitra_wisata_onboarding_id')
                ->constrained('mitra_wisata_onboardings')
                ->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedInteger('price')->default(0);
            $table->unsignedInteger('quota')->default(0);
            $table->unsignedInteger('max_quota_override')->nullable();
            $table->boolean('is_active')->default(false);
            $table->timestamps();

            $table->index(['mitra_wisata_onboarding_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wisata_tickets');
    }
};
