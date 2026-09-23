<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mobile_home_heroes', function (Blueprint $table) {
            $table->string('title')->nullable()->change();
        });
    }

    public function down(): void
    {
        DB::table('mobile_home_heroes')
            ->whereNull('title')
            ->update(['title' => '']);

        Schema::table('mobile_home_heroes', function (Blueprint $table) {
            $table->string('title')->nullable(false)->change();
        });
    }
};
