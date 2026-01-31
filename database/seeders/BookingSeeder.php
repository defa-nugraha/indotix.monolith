<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\BookingRoom;
use App\Models\Hotel;
use App\Models\RoomType;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class BookingSeeder extends Seeder
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

        $vendorId = User::query()->where('role', 'mitra')->value('id');
        $cityCode = DB::table('regencies')->value('code');

        $hotel = Hotel::query()->first();
        if (! $hotel) {
            $hotel = Hotel::create([
                'vendor_id' => $vendorId,
                'name' => 'Indotix Hotel Demo',
                'description' => 'Hotel demo untuk seeder booking.',
                'city_id' => $cityCode,
                'address' => 'Jl. Contoh No. 123',
                'latitude' => -6.2,
                'longitude' => 106.8,
                'star_rating' => 4,
                'check_in_time' => '14:00',
                'check_out_time' => '12:00',
                'status' => 'active',
            ]);
        }

        $roomType = RoomType::query()->where('hotel_id', $hotel->id)->first();
        if (! $roomType) {
            $roomType = RoomType::create([
                'hotel_id' => $hotel->id,
                'name' => 'Standard Room',
                'description' => 'Kamar standar untuk seeder.',
                'max_guest' => 2,
                'bed_type' => 'Queen',
                'base_price' => 350000,
                'strike_price' => 420000,
                'total_rooms' => 20,
                'status' => 'active',
            ]);
        }

        $bookingsData = [
            [
                'status' => 'pending_payment',
                'payment_status' => 'pending',
                'check_in' => Carbon::today()->addDays(3),
                'nights' => 2,
                'rooms' => 1,
                'guests' => 2,
                'deadline_minutes' => 30,
            ],
            [
                'status' => 'paid',
                'payment_status' => 'paid',
                'check_in' => Carbon::today()->addDays(7),
                'nights' => 3,
                'rooms' => 2,
                'guests' => 4,
                'deadline_minutes' => null,
            ],
            [
                'status' => 'cancelled',
                'payment_status' => 'cancelled',
                'check_in' => Carbon::today()->subDays(10),
                'nights' => 1,
                'rooms' => 1,
                'guests' => 1,
                'deadline_minutes' => null,
            ],
        ];

        foreach ($bookingsData as $index => $data) {
            $checkIn = $data['check_in']->copy();
            $checkOut = $checkIn->copy()->addDays($data['nights']);
            $pricePerNight = (int) $roomType->base_price;
            $subtotal = $pricePerNight * $data['nights'] * $data['rooms'];
            $orderId = sprintf('INDOTIX-SEED-%s-%s', $user->id, $index + 1);

            $booking = Booking::create([
                'user_id' => $user->id,
                'hotel_id' => $hotel->id,
                'check_in' => $checkIn->toDateString(),
                'check_out' => $checkOut->toDateString(),
                'nights' => $data['nights'],
                'rooms_count' => $data['rooms'],
                'guests_count' => $data['guests'],
                'currency' => 'IDR',
                'subtotal' => $subtotal,
                'total' => $subtotal,
                'status' => $data['status'],
                'payment_deadline' => $data['deadline_minutes']
                    ? now()->addMinutes($data['deadline_minutes'])
                    : null,
                'guest_name' => $user->name,
                'guest_email' => $user->email,
                'guest_phone' => '08123456789',
                'special_request' => $data['status'] === 'paid' ? 'Kamar non-smoking' : null,
                'midtrans_order_id' => $orderId,
                'payment_status' => $data['payment_status'],
            ]);

            BookingRoom::create([
                'booking_id' => $booking->id,
                'room_type_id' => $roomType->id,
                'rooms_count' => $data['rooms'],
                'price_per_night' => $pricePerNight,
                'subtotal' => $subtotal,
            ]);
        }
    }
}
