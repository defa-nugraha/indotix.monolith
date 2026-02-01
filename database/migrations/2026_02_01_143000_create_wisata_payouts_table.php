<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('wisata_payouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mitra_wisata_onboarding_id')->constrained('mitra_wisata_onboardings')->cascadeOnDelete();
            $table->date('period_start');
            $table->date('period_end');
            $table->unsignedInteger('total_gmv')->default(0);
            $table->unsignedInteger('commission_amount')->default(0);
            $table->unsignedInteger('net_payout')->default(0);
            $table->enum('status', ['pending', 'approved', 'paid', 'rejected'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wisata_payouts');
    }
};
