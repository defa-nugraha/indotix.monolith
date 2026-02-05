<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('academy_classes', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('category')->nullable();
            $table->dateTime('start_at');
            $table->dateTime('end_at');
            $table->unsignedInteger('duration_minutes')->default(0);
            $table->enum('location_type', ['offline', 'online', 'hybrid'])->default('offline');
            $table->string('location_detail')->nullable();
            $table->unsignedInteger('capacity_total')->default(0);
            $table->unsignedInteger('capacity_sold')->default(0);
            $table->enum('status', ['draft', 'scheduled', 'open_for_sale', 'closed', 'completed', 'cancelled'])->default('draft');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('academy_classes');
    }
};
