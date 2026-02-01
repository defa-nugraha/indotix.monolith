<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('mitra_wisata_staff', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mitra_wisata_onboarding_id')
                ->constrained('mitra_wisata_onboardings')
                ->cascadeOnDelete();
            $table->string('name');
            $table->string('email')->nullable();
            $table->enum('role', ['owner', 'admin_mitra', 'staff_validasi'])->default('staff_validasi');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mitra_wisata_staff');
    }
};
