<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('payout_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payout_id')->constrained()->cascadeOnDelete();
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->enum('commission_type', ['percentage', 'fixed']);
            $table->unsignedBigInteger('commission_value');
            $table->unsignedBigInteger('commission_amount');
            $table->unsignedBigInteger('booking_total');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payout_items');
    }
};
