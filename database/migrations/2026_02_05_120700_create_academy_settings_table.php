<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('academy_settings', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('booking_timeout_minutes')->default(15);
            $table->unsignedInteger('cutoff_minutes')->default(60);
            $table->text('refund_policy')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('academy_settings');
    }
};
