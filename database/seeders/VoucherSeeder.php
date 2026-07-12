<?php

namespace Database\Seeders;

use App\Models\Voucher;
use Illuminate\Database\Seeder;

class VoucherSeeder extends Seeder
{
    public function run(): void
    {
        $vouchers = [
            [
                'code' => 'NEWUSER12',
                'discount_type' => 'percentage',
                'discount_value' => 12,
                'min_transaction' => 0,
                'quota_total' => 1000,
                'quota_used' => 0,
                'max_per_user_per_day' => 1,
                'starts_at' => now()->subDay()->toDateString(),
                'ends_at' => now()->addMonths(3)->toDateString(),
                'hotel_id' => null,
                'is_active' => true,
            ],
            [
                'code' => 'WISATAHEMAT20',
                'discount_type' => 'percentage',
                'discount_value' => 20,
                'min_transaction' => 150000,
                'quota_total' => 500,
                'quota_used' => 0,
                'max_per_user_per_day' => 1,
                'starts_at' => now()->subDay()->toDateString(),
                'ends_at' => now()->addMonth()->toDateString(),
                'hotel_id' => null,
                'is_active' => true,
            ],
            [
                'code' => 'LIBURAN50K',
                'discount_type' => 'fixed',
                'discount_value' => 50000,
                'min_transaction' => 300000,
                'quota_total' => 300,
                'quota_used' => 0,
                'max_per_user_per_day' => 1,
                'starts_at' => now()->subDay()->toDateString(),
                'ends_at' => now()->addMonths(2)->toDateString(),
                'hotel_id' => null,
                'is_active' => true,
            ],
            [
                'code' => 'WEEKDAY15',
                'discount_type' => 'percentage',
                'discount_value' => 15,
                'min_transaction' => 100000,
                'quota_total' => 250,
                'quota_used' => 0,
                'max_per_user_per_day' => 1,
                'starts_at' => now()->subDay()->toDateString(),
                'ends_at' => now()->addWeeks(6)->toDateString(),
                'hotel_id' => null,
                'is_active' => true,
            ],
        ];

        foreach ($vouchers as $voucher) {
            Voucher::query()->updateOrCreate(
                ['code' => $voucher['code']],
                $voucher
            );
        }
    }
}
