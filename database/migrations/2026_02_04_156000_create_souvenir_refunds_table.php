<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('souvenir_refunds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('souvenir_order_id')->constrained('souvenir_orders')->cascadeOnDelete();
            $table->string('type');
            $table->unsignedInteger('amount');
            $table->text('reason')->nullable();
            $table->string('status')->default('pending');
            $table->timestamp('resolved_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('souvenir_refunds');
    }
};
