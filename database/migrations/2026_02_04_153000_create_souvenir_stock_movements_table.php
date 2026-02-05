<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('souvenir_stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('souvenir_products')->cascadeOnDelete();
            $table->foreignId('variant_id')->nullable()->constrained('souvenir_variants')->nullOnDelete();
            $table->string('type');
            $table->integer('quantity');
            $table->text('note')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('souvenir_stock_movements');
    }
};
