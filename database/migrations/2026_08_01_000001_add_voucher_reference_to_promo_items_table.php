<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('promo_items', function (Blueprint $table) {
            $table->foreignId('voucher_id')
                ->nullable()
                ->after('link_url')
                ->constrained('vouchers')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('promo_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('voucher_id');
        });
    }
};
