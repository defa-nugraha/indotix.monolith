<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('special_program_scans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('special_program_booking_id')
                ->constrained('special_program_bookings')
                ->cascadeOnDelete();
            $table->foreignId('special_program_variant_id')
                ->nullable()
                ->constrained('special_program_variants')
                ->nullOnDelete();
            $table->dateTime('scanned_at');
            $table->string('officer_name')->nullable();
            $table->string('location')->nullable();
            $table->boolean('is_anomaly')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('special_program_scans');
    }
};
