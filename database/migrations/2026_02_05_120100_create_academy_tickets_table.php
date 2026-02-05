<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('academy_tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academy_class_id')
                ->constrained('academy_classes')
                ->cascadeOnDelete();
            $table->string('name');
            $table->unsignedInteger('price')->default(0);
            $table->unsignedInteger('quota')->nullable();
            $table->enum('ticket_type', ['regular', 'early_bird', 'vip'])->default('regular');
            $table->boolean('refundable')->default(false);
            $table->dateTime('sales_start_at')->nullable();
            $table->dateTime('sales_end_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sold_count')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('academy_tickets');
    }
};
