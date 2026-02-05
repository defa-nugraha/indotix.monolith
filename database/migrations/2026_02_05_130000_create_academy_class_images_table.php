<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('academy_class_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academy_class_id')
                ->constrained('academy_classes')
                ->cascadeOnDelete();
            $table->string('image_path');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('academy_class_images');
    }
};
