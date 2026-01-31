<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('room_inventories', function (Blueprint $table) {
            $table->boolean('breakfast_included')->default(false)->after('is_closed');
            $table->boolean('smoking_allowed')->default(false)->after('breakfast_included');
        });
    }

    public function down(): void
    {
        Schema::table('room_inventories', function (Blueprint $table) {
            $table->dropColumn(['breakfast_included', 'smoking_allowed']);
        });
    }
};
