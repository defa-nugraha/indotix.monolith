<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\EventAttendee;
use App\Models\EventBooking;
use App\Models\EventOrganizer;
use App\Models\EventTicket;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EventSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $userId = 3;
            $organizer = EventOrganizer::query()->firstOrCreate(
                ['user_id' => $userId],
                [
                    'name' => 'Indotix Event Organizer',
                    'email' => 'eo@indotix.id',
                    'phone' => '081234567890',
                    'status' => 'verified',
                ]
            );

            $event = Event::query()->create([
                'event_organizer_id' => $organizer->id,
                'title' => 'Indotix Music Festival 2026',
                'description' => 'Festival musik terbesar dengan line-up artis nasional.',
                'city_code' => '3173',
                'location' => 'Jakarta Convention Center',
                'address' => 'Jl. Gatot Subroto, Jakarta',
                'start_at' => now()->addDays(15)->setTime(18, 0),
                'end_at' => now()->addDays(15)->setTime(23, 0),
                'status' => 'published',
                'capacity_total' => 1000,
                'capacity_sold' => 2,
                'sales_stopped' => false,
                'published_at' => now(),
            ]);

            $ticket = EventTicket::query()->create([
                'event_id' => $event->id,
                'name' => 'Regular Pass',
                'description' => 'Akses masuk area festival.',
                'price' => 250000,
                'benefits' => ['Akses 1 hari', 'E-ticket'],
                'is_active' => true,
                'max_per_user' => 5,
                'quota' => 1000,
                'sold_count' => 2,
            ]);

            $booking = EventBooking::query()->create([
                'user_id' => $userId,
                'event_id' => $event->id,
                'event_ticket_id' => $ticket->id,
                'booking_code' => 'EVT-'.Str::upper(Str::random(8)),
                'quantity' => 2,
                'total_price' => 500000,
                'status' => 'paid',
                'payment_status' => 'settlement',
                'payment_deadline' => now()->addMinutes(15),
                'guest_name' => 'User Indotix',
                'guest_email' => 'user@indotix.id',
                'guest_phone' => '081234567890',
                'midtrans_order_id' => 'EVT-ORDER-'.Str::upper(Str::random(6)),
            ]);

            EventAttendee::query()->create([
                'event_booking_id' => $booking->id,
                'name' => 'User Indotix',
                'email' => 'user@indotix.id',
                'phone' => '081234567890',
                'checked_in' => false,
            ]);
            EventAttendee::query()->create([
                'event_booking_id' => $booking->id,
                'name' => 'Tamu Indotix',
                'email' => 'tamu@indotix.id',
                'phone' => '081234567891',
                'checked_in' => false,
            ]);
        });
    }
}
