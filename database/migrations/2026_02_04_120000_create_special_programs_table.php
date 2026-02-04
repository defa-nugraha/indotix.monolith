<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('special_programs', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('program_type');
            $table->text('description_internal')->nullable();
            $table->date('starts_at')->nullable();
            $table->date('ends_at')->nullable();
            $table->string('status')->default('draft');
            $table->boolean('is_active')->default(false);
            $table->json('scope')->nullable();
            $table->json('rules')->nullable();
            $table->json('discount')->nullable();
            $table->json('visibility')->nullable();
            $table->json('budget')->nullable();
            $table->json('compliance')->nullable();
            $table->text('terms')->nullable();
            $table->unsignedInteger('priority')->default(0);
            $table->string('highlight_level')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('special_programs');
    }
};
