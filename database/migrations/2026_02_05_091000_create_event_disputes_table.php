<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('event_disputes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_booking_id')
                ->constrained('event_bookings')
                ->cascadeOnDelete();
            $table->foreignId('event_ticket_id')
                ->nullable()
                ->constrained('event_tickets')
                ->nullOnDelete();
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->string('subject');
            $table->text('description');
            $table->string('attachment_path')->nullable();
            $table->enum('status', ['open', 'resolved', 'closed'])->default('open');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_disputes');
    }
};
