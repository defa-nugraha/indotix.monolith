<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('wisata_tickets', function (Blueprint $table) {
            $table->unsignedInteger('min_order_quantity')->default(1);
            $table->unsignedInteger('max_order_quantity')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('wisata_tickets', function (Blueprint $table) {
            $table->dropColumn(['min_order_quantity', 'max_order_quantity']);
        });
    }
};
