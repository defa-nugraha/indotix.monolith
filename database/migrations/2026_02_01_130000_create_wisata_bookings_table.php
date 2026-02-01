<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('wisata_bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('mitra_wisata_onboarding_id')
                ->constrained('mitra_wisata_onboardings')
                ->cascadeOnDelete();
            $table->foreignId('wisata_ticket_id')
                ->constrained('wisata_tickets')
                ->cascadeOnDelete();
            $table->string('booking_code')->unique();
            $table->date('visit_date');
            $table->unsignedInteger('quantity')->default(1);
            $table->unsignedInteger('unit_price')->default(0);
            $table->unsignedInteger('total_price')->default(0);
            $table->enum('status', ['pending_payment', 'paid', 'cancelled', 'expired', 'completed'])->default('pending_payment');
            $table->timestamps();

            $table->index(['visit_date', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wisata_bookings');
    }
};
