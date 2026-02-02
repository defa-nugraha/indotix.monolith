<?php

namespace Database\Seeders;

use App\Models\MitraWisataOnboarding;
use App\Models\User;
use App\Models\WisataBooking;
use App\Models\WisataTicket;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class WisataBookingSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::query()->find(3);
        if (! $user) {
            DB::table('users')->insert([
                'id' => 3,
                'name' => 'User Indotix',
                'email' => 'user3@indotix.test',
                'password' => Hash::make('password'),
                'role' => 'user',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $user = User::query()->find(3);
        }

        $mitraUserId = User::query()->where('role', 'mitra')->value('id');
        if (! $mitraUserId) {
            $mitraUserId = DB::table('users')->insertGetId([
                'name' => 'Mitra Wisata Demo',
                'email' => 'mitra.wisata@indotix.test',
                'password' => Hash::make('password'),
                'role' => 'mitra',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $provinceCode = DB::table('provinces')->value('code');
        $cityCode = DB::table('regencies')->value('code');

        $destination = MitraWisataOnboarding::query()->first();
        if (! $destination) {
            $destination = MitraWisataOnboarding::create([
                'user_id' => $mitraUserId,
                'current_step' => 3,
                'responsible_name' => 'Budi Santoso',
                'responsible_phone' => '081234567890',
                'responsible_role' => 'owner',
                'destination_name' => 'Wisata Alam Indotix',
                'destination_type' => 'alam',
                'description' => 'Destinasi wisata alam dengan pemandangan indah.',
                'highlights' => 'Spot foto, area piknik, dan kuliner lokal.',
                'province_code' => $provinceCode,
                'city_code' => $cityCode,
                'address_full' => 'Jl. Wisata Indah No. 1',
                'maps_pin_url' => 'https://www.google.com/maps?q=-6.2,106.8',
                'open_days' => json_encode(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']),
                'open_time' => '08:00',
                'close_time' => '17:00',
                'facilities' => json_encode(['Parkir', 'Toilet', 'Mushola', 'Warung']),
                'contact_phone' => '081234567890',
                'verification_status' => 'verified',
                'is_live' => true,
                'is_temporarily_closed' => false,
            ]);
        }

        $ticket = WisataTicket::query()->where('mitra_wisata_onboarding_id', $destination->id)->first();
        if (! $ticket) {
            $ticket = WisataTicket::create([
                'mitra_wisata_onboarding_id' => $destination->id,
                'name' => 'Tiket Masuk Regular',
                'description' => 'Tiket masuk harian untuk semua pengunjung.',
                'price' => 50000,
                'quota' => 200,
                'is_active' => true,
            ]);
        }

        $bookingsData = [
            [
                'status' => 'pending_payment',
                'payment_status' => 'pending',
                'visit_date' => Carbon::today()->addDays(2),
                'quantity' => 2,
                'deadline_minutes' => 30,
            ],
            [
                'status' => 'paid',
                'payment_status' => 'paid',
                'visit_date' => Carbon::today()->addDays(5),
                'quantity' => 3,
                'deadline_minutes' => null,
            ],
            [
                'status' => 'cancelled',
                'payment_status' => 'cancelled',
                'visit_date' => Carbon::today()->subDays(3),
                'quantity' => 1,
                'deadline_minutes' => null,
            ],
        ];

        foreach ($bookingsData as $index => $data) {
            WisataBooking::create([
                'user_id' => $user->id,
                'mitra_wisata_onboarding_id' => $destination->id,
                'wisata_ticket_id' => $ticket->id,
                'booking_code' => strtoupper('WISATA-'.$user->id.'-'.now()->format('ymdHis').'-'.$index),
                'visit_date' => $data['visit_date']->toDateString(),
                'quantity' => $data['quantity'],
                'unit_price' => $ticket->price,
                'total_price' => $ticket->price * $data['quantity'],
                'status' => $data['status'],
                'payment_status' => $data['payment_status'],
                'payment_deadline' => $data['deadline_minutes']
                    ? now()->addMinutes($data['deadline_minutes'])
                    : null,
                'guest_name' => $user->name,
                'guest_email' => $user->email,
                'guest_phone' => '08123456789',
                'midtrans_order_id' => sprintf('WISATA-SEED-%s-%s', $user->id, $index + 1),
            ]);
        }
    }
}
