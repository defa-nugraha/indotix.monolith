<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\EventOrganizer;
use App\Models\EventTicket;
use Illuminate\Database\Seeder;

class SpecialProgramSeeder extends Seeder
{
    public function run(): void
    {
        $existingIds = Event::query()
            ->where('event_type', 'special_program')
            ->pluck('id');

        if ($existingIds->isNotEmpty()) {
            EventTicket::query()->whereIn('event_id', $existingIds)->delete();
            Event::query()->whereIn('id', $existingIds)->delete();
        }

        $organizer = EventOrganizer::query()->firstOrCreate(
            ['user_id' => null, 'name' => 'Indotix Special Program'],
            [
                'email' => null,
                'phone' => null,
                'status' => 'verified',
                'notes' => 'Organizer internal untuk special program.',
            ]
        );

        $programs = [
            [
                'title' => 'Libur Sekolah Hemat',
                'description' => 'Program diskon khusus libur sekolah untuk pengalaman liburan keluarga.',
                'city_code' => null,
                'location' => 'Indonesia',
                'address' => null,
                'start_at' => now()->addDays(7),
                'end_at' => now()->addDays(14),
                'status' => 'published',
                'capacity_total' => 3000,
                'tickets' => [
                    ['name' => 'Pass Promo', 'price' => 120000, 'quota' => 1500],
                ],
            ],
            [
                'title' => 'Flash Sale Festival',
                'description' => 'Promo terbatas untuk tiket festival pilihan dengan harga terbaik.',
                'city_code' => null,
                'location' => 'Jakarta',
                'address' => null,
                'start_at' => now()->addDays(3),
                'end_at' => now()->addDays(5),
                'status' => 'published',
                'capacity_total' => 1500,
                'tickets' => [
                    ['name' => 'Flash Pass', 'price' => 180000, 'quota' => 800],
                ],
            ],
            [
                'title' => 'Hemat Akhir Pekan',
                'description' => 'Special program untuk staycation dan aktivitas akhir pekan dengan benefit ekstra.',
                'city_code' => null,
                'location' => 'Bandung',
                'address' => null,
                'start_at' => now()->addDays(10),
                'end_at' => now()->addDays(17),
                'status' => 'published',
                'capacity_total' => 2000,
                'tickets' => [
                    ['name' => 'Weekend Pass', 'price' => 350000, 'quota' => 1000],
                ],
            ],
        ];

        foreach ($programs as $programData) {
            $tickets = $programData['tickets'];
            unset($programData['tickets']);

            $event = Event::create([
                'event_organizer_id' => $organizer->id,
                'event_type' => 'special_program',
                'title' => $programData['title'],
                'description' => $programData['description'],
                'city_code' => $programData['city_code'],
                'location' => $programData['location'],
                'address' => $programData['address'],
                'start_at' => $programData['start_at'],
                'end_at' => $programData['end_at'],
                'status' => $programData['status'],
                'capacity_total' => $programData['capacity_total'],
                'capacity_sold' => 0,
                'sales_stopped' => false,
            ]);

            foreach ($tickets as $ticket) {
                EventTicket::create([
                    'event_id' => $event->id,
                    'name' => $ticket['name'],
                    'description' => 'Tiket promo untuk special program.',
                    'price' => $ticket['price'],
                    'quota' => $ticket['quota'],
                    'sold_count' => 0,
                    'is_active' => true,
                    'max_per_user' => 4,
                ]);
            }
        }
    }
}
