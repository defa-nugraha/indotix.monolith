<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('academy_scans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academy_booking_id')
                ->constrained('academy_bookings')
                ->cascadeOnDelete();
            $table->foreignId('academy_ticket_id')
                ->constrained('academy_tickets')
                ->cascadeOnDelete();
            $table->dateTime('scanned_at');
            $table->string('officer_name')->nullable();
            $table->string('device')->nullable();
            $table->boolean('is_anomaly')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('academy_scans');
    }
};
