<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('wisata_ticket_scans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wisata_booking_id')
                ->constrained('wisata_bookings')
                ->cascadeOnDelete();
            $table->timestamp('scanned_at');
            $table->string('officer_name')->nullable();
            $table->string('location')->nullable();
            $table->boolean('is_anomaly')->default(false);
            $table->timestamps();

            $table->index(['scanned_at', 'is_anomaly']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wisata_ticket_scans');
    }
};
