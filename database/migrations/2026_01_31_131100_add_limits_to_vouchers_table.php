<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            $table->unsignedBigInteger('min_transaction')->default(0)->after('discount_value');
            $table->unsignedInteger('max_per_user_per_day')->default(0)->after('quota_used');
        });
    }

    public function down(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            $table->dropColumn(['min_transaction', 'max_per_user_per_day']);
        });
    }
};
