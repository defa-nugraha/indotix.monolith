<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('souvenir_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('souvenir_order_id')->constrained('souvenir_orders')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('souvenir_products')->cascadeOnDelete();
            $table->foreignId('variant_id')->nullable()->constrained('souvenir_variants')->nullOnDelete();
            $table->string('product_name');
            $table->string('sku')->nullable();
            $table->unsignedInteger('unit_price');
            $table->unsignedInteger('quantity')->default(1);
            $table->unsignedInteger('subtotal');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('souvenir_order_items');
    }
};
