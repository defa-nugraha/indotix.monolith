<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('special_programs', function (Blueprint $table) {
            $table->string('category')->nullable()->after('name');
            $table->text('description')->nullable()->after('category');
            $table->unsignedBigInteger('base_price')->default(0)->after('description');
            $table->unsignedInteger('capacity')->nullable()->after('base_price');
            $table->string('image_path')->nullable()->after('capacity');
        });
    }

    public function down(): void
    {
        Schema::table('special_programs', function (Blueprint $table) {
            $table->dropColumn(['category', 'description', 'base_price', 'capacity', 'image_path']);
        });
    }
};
