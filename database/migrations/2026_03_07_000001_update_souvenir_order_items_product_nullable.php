<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('souvenir_order_items', function (Blueprint $table) {
            $table->dropForeign(['product_id']);
        });

        DB::statement('ALTER TABLE souvenir_order_items MODIFY product_id BIGINT UNSIGNED NULL');

        Schema::table('souvenir_order_items', function (Blueprint $table) {
            $table->foreign('product_id')->references('id')->on('souvenir_products')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('souvenir_order_items', function (Blueprint $table) {
            $table->dropForeign(['product_id']);
        });

        DB::statement('ALTER TABLE souvenir_order_items MODIFY product_id BIGINT UNSIGNED NOT NULL');

        Schema::table('souvenir_order_items', function (Blueprint $table) {
            $table->foreign('product_id')->references('id')->on('souvenir_products')->cascadeOnDelete();
        });
    }
};
