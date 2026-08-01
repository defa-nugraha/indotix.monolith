<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('wisata_bookings', function (Blueprint $table) {
            $table->unsignedInteger('subtotal_price')->default(0)->after('unit_price');
            $table->foreignId('voucher_id')
                ->nullable()
                ->after('subtotal_price')
                ->constrained('vouchers')
                ->nullOnDelete();
            $table->string('voucher_code')->nullable()->after('voucher_id');
            $table->string('discount_type', 20)->nullable()->after('voucher_code');
            $table->unsignedBigInteger('discount_value')->nullable()->after('discount_type');
            $table->unsignedBigInteger('discount_amount')->nullable()->after('discount_value');
        });
    }

    public function down(): void
    {
        Schema::table('wisata_bookings', function (Blueprint $table) {
            $table->dropConstrainedForeignId('voucher_id');
            $table->dropColumn([
                'subtotal_price',
                'voucher_code',
                'discount_type',
                'discount_value',
                'discount_amount',
            ]);
        });
    }
};
