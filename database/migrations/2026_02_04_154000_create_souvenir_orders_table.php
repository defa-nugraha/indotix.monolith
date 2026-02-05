<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('souvenir_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('pending_payment');
            $table->string('payment_status')->nullable();
            $table->unsignedInteger('total_price')->default(0);
            $table->string('shipping_method')->default('delivery');
            $table->text('shipping_address')->nullable();
            $table->unsignedInteger('shipping_cost')->default(0);
            $table->string('shipping_status')->nullable();
            $table->string('tracking_number')->nullable();
            $table->timestamp('shipped_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('payment_deadline')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('souvenir_orders');
    }
};
