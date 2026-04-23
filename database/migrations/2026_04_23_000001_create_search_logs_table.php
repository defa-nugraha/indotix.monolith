<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('search_logs', function (Blueprint $table) {
            $table->id();
            $table->string('product_type', 64);
            $table->string('keyword')->nullable();
            $table->json('filters')->nullable();
            $table->unsignedInteger('result_count')->default(0);
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->ipAddress('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            $table->index(['product_type', 'created_at']);
            $table->index(['product_type', 'keyword']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('search_logs');
    }
};
