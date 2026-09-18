<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wisata_payment_side_effects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wisata_payment_id')
                ->constrained('wisata_payments')
                ->cascadeOnDelete();
            $table->string('effect_type', 32);
            $table->string('status', 24)->default('pending');
            $table->unsignedSmallInteger('attempts')->default(0);
            $table->timestamp('claimed_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->text('last_error')->nullable();
            $table->timestamps();

            $table->unique(
                ['wisata_payment_id', 'effect_type'],
                'wisata_payment_effect_unique'
            );
            $table->index(
                ['status', 'claimed_at'],
                'wisata_payment_effect_status_claimed_idx'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wisata_payment_side_effects');
    }
};
