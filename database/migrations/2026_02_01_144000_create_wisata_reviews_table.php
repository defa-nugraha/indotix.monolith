<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('wisata_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mitra_wisata_onboarding_id')->constrained('mitra_wisata_onboardings')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->tinyInteger('rating')->default(0);
            $table->text('comment')->nullable();
            $table->enum('status', ['active', 'flagged', 'removed'])->default('active');
            $table->text('flag_reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wisata_reviews');
    }
};
