<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mobile_home_heroes', function (Blueprint $table) {
            $table->unsignedInteger('sort_order')->default(0)->after('poster_path');
            $table->dateTime('starts_at')->nullable()->after('sort_order');
            $table->dateTime('ends_at')->nullable()->after('starts_at');
        });
    }

    public function down(): void
    {
        Schema::table('mobile_home_heroes', function (Blueprint $table) {
            $table->dropColumn(['sort_order', 'starts_at', 'ends_at']);
        });
    }
};
