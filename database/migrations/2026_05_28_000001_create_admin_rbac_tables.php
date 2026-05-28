<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_roles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('admin_permissions', function (Blueprint $table) {
            $table->id();
            $table->string('feature');
            $table->string('action');
            $table->string('label');
            $table->timestamps();
            $table->unique(['feature', 'action']);
        });

        Schema::create('admin_permission_role', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_role_id')->constrained()->cascadeOnDelete();
            $table->foreignId('admin_permission_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['admin_role_id', 'admin_permission_id']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('admin_role_id')->nullable()->after('role')->constrained('admin_roles')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('admin_role_id');
        });

        Schema::dropIfExists('admin_permission_role');
        Schema::dropIfExists('admin_permissions');
        Schema::dropIfExists('admin_roles');
    }
};
