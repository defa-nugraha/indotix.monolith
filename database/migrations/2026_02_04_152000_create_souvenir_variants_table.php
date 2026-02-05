<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('souvenir_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('souvenir_products')->cascadeOnDelete();
            $table->string('variant_type');
            $table->string('name');
            $table->string('sku')->nullable();
            $table->integer('additional_price')->default(0);
            $table->integer('stock')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('souvenir_variants');
    }
};
