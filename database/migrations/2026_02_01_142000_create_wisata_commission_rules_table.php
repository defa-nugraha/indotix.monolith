<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('wisata_commission_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mitra_wisata_onboarding_id')->nullable()->constrained('mitra_wisata_onboardings')->nullOnDelete();
            $table->enum('type', ['percentage', 'fixed']);
            $table->unsignedInteger('value');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wisata_commission_rules');
    }
};
