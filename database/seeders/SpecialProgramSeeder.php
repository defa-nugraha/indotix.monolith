<?php

namespace Database\Seeders;

use App\Models\SpecialProgram;
use App\Models\SpecialProgramItem;
use App\Models\Hotel;
use App\Models\MitraWisataOnboarding;
use App\Models\Event;
use Illuminate\Database\Seeder;

class SpecialProgramSeeder extends Seeder
{
    public function run(): void
    {
        SpecialProgramItem::query()->delete();
        SpecialProgram::query()->delete();

        $programA = SpecialProgram::create([
            'name' => 'Libur Sekolah Hemat',
            'program_type' => 'diskon',
            'description_internal' => 'Campaign diskon khusus libur sekolah untuk meningkatkan transaksi keluarga.',
            'starts_at' => now()->addDays(3)->toDateString(),
            'ends_at' => now()->addDays(30)->toDateString(),
            'status' => 'scheduled',
            'is_active' => false,
            'scope' => [
                'mode' => 'all',
                'categories' => ['hotel', 'wisata'],
                'locations' => ['Jakarta', 'Bandung'],
                'partners' => [],
                'events' => [],
            ],
            'rules' => [
                'min_transaction' => 150000,
                'max_quota' => 500,
                'per_user_limit' => 2,
                'stackable' => false,
                'used_quota' => 0,
            ],
            'discount' => [
                'type' => 'percentage',
                'value' => 15,
                'platform_subsidy' => 10,
                'partner_subsidy' => 5,
                'max_cap' => 75000,
            ],
            'visibility' => [
                'placements' => ['homepage_banner', 'special_section'],
                'priority' => 1,
                'highlight_level' => 'high',
                'push_enabled' => true,
                'tag_label' => 'Libur Sekolah',
            ],
            'budget' => [
                'limit' => 25000000,
                'used' => 0,
            ],
            'compliance' => [
                'partner_notification' => 'Campaign libur sekolah akan dimulai minggu depan. Pastikan ketersediaan update.',
                'partner_approval_required' => false,
                'legal_note' => 'Diskon gabungan platform + mitra sesuai perjanjian 2026.',
            ],
            'terms' => 'Berlaku untuk transaksi minimum Rp150.000. Tidak dapat digabung voucher lain.',
            'priority' => 1,
            'highlight_level' => 'high',
        ]);

        $programB = SpecialProgram::create([
            'name' => 'Early Access Konser',
            'program_type' => 'highlight',
            'description_internal' => 'Highlight event konser utama dengan akses early booking.',
            'starts_at' => now()->toDateString(),
            'ends_at' => now()->addDays(14)->toDateString(),
            'status' => 'active',
            'is_active' => true,
            'scope' => [
                'mode' => 'selected',
                'categories' => ['event'],
                'locations' => ['Jakarta'],
                'partners' => ['EO Prime'],
                'events' => ['Konser Akhir Tahun'],
            ],
            'rules' => [
                'min_transaction' => 0,
                'max_quota' => 1000,
                'per_user_limit' => 4,
                'stackable' => true,
                'used_quota' => 120,
            ],
            'discount' => [
                'type' => 'highlight',
                'value' => 0,
                'platform_subsidy' => 0,
                'partner_subsidy' => 0,
                'max_cap' => 0,
            ],
            'visibility' => [
                'placements' => ['special_section', 'tag_special'],
                'priority' => 2,
                'highlight_level' => 'medium',
                'push_enabled' => true,
                'tag_label' => 'Early Access',
            ],
            'budget' => [
                'limit' => 0,
                'used' => 0,
            ],
            'compliance' => [
                'partner_notification' => 'Program early access aktif, pastikan kapasitas siap.',
                'partner_approval_required' => true,
                'legal_note' => 'Perlu persetujuan mitra karena exposure tinggi.',
            ],
            'terms' => 'Akses early booking berlaku 7 hari sebelum publik.',
            'priority' => 2,
            'highlight_level' => 'medium',
        ]);

        $programC = SpecialProgram::create([
            'name' => 'Flash Sale Weekend',
            'program_type' => 'subsidi',
            'description_internal' => 'Subsidi platform untuk meningkatkan transaksi weekend.',
            'starts_at' => now()->addDays(1)->toDateString(),
            'ends_at' => now()->addDays(3)->toDateString(),
            'status' => 'scheduled',
            'is_active' => false,
            'scope' => [
                'mode' => 'all',
                'categories' => ['hotel', 'wisata'],
                'locations' => [],
                'partners' => [],
                'events' => [],
            ],
            'rules' => [
                'min_transaction' => 100000,
                'max_quota' => 300,
                'per_user_limit' => 1,
                'stackable' => false,
                'used_quota' => 0,
            ],
            'discount' => [
                'type' => 'fixed',
                'value' => 25000,
                'platform_subsidy' => 25000,
                'partner_subsidy' => 0,
                'max_cap' => 25000,
            ],
            'visibility' => [
                'placements' => ['homepage_banner'],
                'priority' => 3,
                'highlight_level' => 'low',
                'push_enabled' => false,
                'tag_label' => 'Flash Sale',
            ],
            'budget' => [
                'limit' => 10000000,
                'used' => 0,
            ],
            'compliance' => [
                'partner_notification' => 'Flash sale weekend akan aktif, pastikan harga sesuai.',
                'partner_approval_required' => false,
                'legal_note' => '',
            ],
            'terms' => 'Flash sale berlaku selama 48 jam.',
            'priority' => 3,
            'highlight_level' => 'low',
        ]);

        $hotel = Hotel::query()->where('status', 'active')->first();
        $destination = MitraWisataOnboarding::query()->where('verification_status', 'verified')->first();
        $event = Event::query()->where('status', 'published')->first();

        if ($hotel) {
            SpecialProgramItem::create([
                'special_program_id' => $programA->id,
                'item_type' => 'hotel',
                'item_id' => $hotel->id,
                'sort_order' => 1,
                'is_active' => true,
            ]);
        }

        if ($destination) {
            SpecialProgramItem::create([
                'special_program_id' => $programA->id,
                'item_type' => 'wisata',
                'item_id' => $destination->id,
                'sort_order' => 2,
                'is_active' => true,
            ]);
        }

        if ($event) {
            SpecialProgramItem::create([
                'special_program_id' => $programB->id,
                'item_type' => 'event',
                'item_id' => $event->id,
                'sort_order' => 1,
                'is_active' => true,
            ]);
        }

        if ($hotel) {
            SpecialProgramItem::create([
                'special_program_id' => $programC->id,
                'item_type' => 'hotel',
                'item_id' => $hotel->id,
                'sort_order' => 1,
                'is_active' => true,
            ]);
        }
    }
}
