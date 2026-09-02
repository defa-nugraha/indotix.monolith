<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('voucher_wisata_destination', function (Blueprint $table) {
            $table->id();
            $table->foreignId('voucher_id')->constrained('vouchers')->cascadeOnDelete();
            $table->foreignId('mitra_wisata_onboarding_id')
                ->constrained('mitra_wisata_onboardings')
                ->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['voucher_id', 'mitra_wisata_onboarding_id'], 'voucher_wisata_destination_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('voucher_wisata_destination');
    }
};
