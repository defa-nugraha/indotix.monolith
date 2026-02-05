<?php

namespace Database\Seeders;

use App\Models\AcademyAttendee;
use App\Models\AcademyBooking;
use App\Models\AcademyClass;
use App\Models\AcademyTicket;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AcademySeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $downloadImage = function (string $url, string $path): ?string {
                try {
                    $response = Http::timeout(15)->get($url);
                    if (! $response->successful()) {
                        return null;
                    }
                    Storage::disk('public')->put($path, $response->body());
                    return $path;
                } catch (\Throwable $e) {
                    return null;
                }
            };

            $class = AcademyClass::query()->create([
                'title' => 'Eljohn Academy: Hospitality Bootcamp',
                'description' => 'Pelatihan intensif untuk meningkatkan skill layanan dan operasional hotel.',
                'category' => 'Hospitality',
                'start_at' => now()->addDays(10)->setTime(9, 0),
                'end_at' => now()->addDays(10)->setTime(16, 0),
                'duration_minutes' => 420,
                'location_type' => 'offline',
                'location_detail' => 'Neo Soho Capital, Jakarta Barat',
                'capacity_total' => 80,
                'capacity_sold' => 2,
                'status' => 'open_for_sale',
                'is_active' => true,
            ]);

            $class2 = AcademyClass::query()->create([
                'title' => 'Eljohn Academy: Event Production Masterclass',
                'description' => 'Kelas praktis untuk mengelola event dari konsep hingga eksekusi.',
                'category' => 'Event Management',
                'start_at' => now()->addDays(18)->setTime(10, 0),
                'end_at' => now()->addDays(18)->setTime(16, 30),
                'duration_minutes' => 390,
                'location_type' => 'hybrid',
                'location_detail' => 'Indotix Hall + Zoom',
                'capacity_total' => 120,
                'capacity_sold' => 5,
                'status' => 'scheduled',
                'is_active' => true,
            ]);

            $class3 = AcademyClass::query()->create([
                'title' => 'Eljohn Academy: Digital Marketing for Tourism',
                'description' => 'Strategi pemasaran digital untuk destinasi wisata dan produk wisata.',
                'category' => 'Marketing',
                'start_at' => now()->addDays(25)->setTime(9, 30),
                'end_at' => now()->addDays(25)->setTime(15, 0),
                'duration_minutes' => 330,
                'location_type' => 'online',
                'location_detail' => 'Zoom Meeting',
                'capacity_total' => 150,
                'capacity_sold' => 0,
                'status' => 'draft',
                'is_active' => true,
            ]);

            $regular = AcademyTicket::query()->create([
                'academy_class_id' => $class->id,
                'name' => 'Regular',
                'price' => 350000,
                'quota' => 80,
                'ticket_type' => 'regular',
                'refundable' => false,
                'sales_start_at' => now()->subDays(2),
                'sales_end_at' => now()->addDays(9),
                'is_active' => true,
                'sold_count' => 2,
            ]);

            AcademyTicket::query()->create([
                'academy_class_id' => $class->id,
                'name' => 'VIP',
                'price' => 550000,
                'quota' => 20,
                'ticket_type' => 'vip',
                'refundable' => true,
                'sales_start_at' => now()->subDays(2),
                'sales_end_at' => now()->addDays(9),
                'is_active' => true,
                'sold_count' => 0,
            ]);

            AcademyTicket::query()->create([
                'academy_class_id' => $class2->id,
                'name' => 'Regular',
                'price' => 400000,
                'quota' => 120,
                'ticket_type' => 'regular',
                'refundable' => false,
                'sales_start_at' => now()->subDays(1),
                'sales_end_at' => now()->addDays(17),
                'is_active' => true,
                'sold_count' => 5,
            ]);

            AcademyTicket::query()->create([
                'academy_class_id' => $class3->id,
                'name' => 'Early Bird',
                'price' => 250000,
                'quota' => 50,
                'ticket_type' => 'early_bird',
                'refundable' => true,
                'sales_start_at' => now()->subDays(1),
                'sales_end_at' => now()->addDays(20),
                'is_active' => true,
                'sold_count' => 0,
            ]);

            $booking = AcademyBooking::query()->create([
                'user_id' => 3,
                'academy_class_id' => $class->id,
                'academy_ticket_id' => $regular->id,
                'booking_code' => 'ACD-'.Str::upper(Str::random(8)),
                'quantity' => 2,
                'total_price' => 700000,
                'status' => 'paid',
                'payment_status' => 'settlement',
                'payment_deadline' => now()->addMinutes(15),
                'guest_name' => 'User Indotix',
                'guest_email' => 'user@indotix.id',
                'guest_phone' => '081234567890',
                'midtrans_order_id' => 'ACD-ORDER-'.Str::upper(Str::random(6)),
            ]);

            AcademyAttendee::query()->create([
                'academy_booking_id' => $booking->id,
                'name' => 'User Indotix',
                'email' => 'user@indotix.id',
                'phone' => '081234567890',
                'attendance_status' => 'absent',
            ]);
            AcademyAttendee::query()->create([
                'academy_booking_id' => $booking->id,
                'name' => 'Tamu Indotix',
                'email' => 'tamu@indotix.id',
                'phone' => '081234567891',
                'attendance_status' => 'absent',
            ]);

            $imageSets = [
                $class->id => [
                    'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
                ],
                $class2->id => [
                    'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1503428593586-e225b39bddfe?auto=format&fit=crop&w=1200&q=80',
                ],
                $class3->id => [
                    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
                ],
            ];

            foreach ($imageSets as $classId => $urls) {
                foreach ($urls as $index => $url) {
                    $path = "academy/classes/{$classId}/seed_{$index}.jpg";
                    $stored = $downloadImage($url, $path);
                    if ($stored) {
                        \App\Models\AcademyClassImage::query()->create([
                            'academy_class_id' => $classId,
                            'image_path' => $stored,
                        ]);
                    }
                }
            }
        });
    }
}
