<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('mitra_event_staff', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mitra_event_onboarding_id')
                ->constrained('mitra_event_onboardings')
                ->cascadeOnDelete();
            $table->string('name');
            $table->string('email')->nullable();
            $table->enum('role', ['owner', 'admin_event', 'staff_checkin'])->default('staff_checkin');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mitra_event_staff');
    }
};
