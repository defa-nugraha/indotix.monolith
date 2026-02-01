<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('wisata_disputes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wisata_booking_id')->constrained('wisata_bookings')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('mitra_wisata_onboarding_id')->constrained('mitra_wisata_onboardings')->cascadeOnDelete();
            $table->foreignId('wisata_ticket_id')->constrained('wisata_tickets')->cascadeOnDelete();
            $table->string('subject');
            $table->text('description');
            $table->enum('status', ['open', 'investigating', 'resolved', 'rejected'])->default('open');
            $table->text('resolution')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wisata_disputes');
    }
};
