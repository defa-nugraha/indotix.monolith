<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_review_media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_review_id')->constrained('product_reviews')->cascadeOnDelete();
            $table->enum('type', ['image', 'video'])->index();
            $table->string('path');
            $table->string('thumbnail_path')->nullable();
            $table->string('mime')->nullable();
            $table->unsignedBigInteger('size')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_review_media');
    }
};
