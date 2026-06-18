<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('mobile_error_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('message');
            $table->string('exception_type')->nullable();
            $table->longText('stack_trace')->nullable();
            $table->string('context')->nullable();
            $table->string('source', 100)->nullable();
            $table->string('platform', 80)->nullable();
            $table->string('app_version', 80)->nullable();
            $table->string('build_number', 80)->nullable();
            $table->json('device')->nullable();
            $table->json('extra')->nullable();
            $table->boolean('fatal')->default(false);
            $table->string('ip_address', 64)->nullable();
            $table->string('user_agent', 255)->nullable();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
            $table->index(['platform', 'created_at']);
            $table->index(['fatal', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mobile_error_logs');
    }
};
