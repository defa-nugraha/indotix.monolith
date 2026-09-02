<?php

namespace Database\Seeders;

use App\Models\MitraWisataOnboarding;
use App\Models\User;
use App\Models\WisataBooking;
use App\Models\WisataBookingItem;
use App\Models\WisataPayment;
use App\Models\WisataTicket;
use App\Models\WisataTicketScan;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class WisataScanReadySeeder extends Seeder
{
    private const PASSWORD = 'Password123!';
    private const MITRA_EMAIL = 'scan.mitra.wisata@indotix.id';
    private const USER_EMAIL = 'scan.user@indotix.id';
    private const BOOKING_CODE = 'WIS-SCAN-DEMO-001';
    private const ORDER_ID = 'WISATA-SCAN-DEMO-PAID-001';

    public function run(): void
    {
        $this->ensureRegions();

        $mitraUser = $this->upsertUser([
            'name' => 'Mitra Scan Wisata',
            'email' => self::MITRA_EMAIL,
            'phone' => '081200009001',
            'gender' => 'other',
            'password' => self::PASSWORD,
            'role' => 'mitra',
            'mitra_onboarding_type' => 'wisata',
            'email_verified_at' => now(),
            'is_suspended' => false,
            'suspended_at' => null,
            'suspended_reason' => null,
        ]);

        $customerUser = $this->upsertUser([
            'name' => 'User Scan Wisata',
            'email' => self::USER_EMAIL,
            'phone' => '081200009002',
            'gender' => 'other',
            'password' => self::PASSWORD,
            'role' => 'user',
            'email_verified_at' => now(),
            'is_suspended' => false,
            'suspended_at' => null,
            'suspended_reason' => null,
        ]);

        $assets = $this->ensureAssets();

        $destination = MitraWisataOnboarding::query()->updateOrCreate(
            ['user_id' => $mitraUser->id],
            $this->tablePayload('mitra_wisata_onboardings', [
                'current_step' => 3,
                'responsible_name' => $mitraUser->name,
                'responsible_phone' => $mitraUser->phone,
                'responsible_role' => 'owner',
                'destination_name' => 'Wisata Scan Demo Indotix',
                'destination_type' => 'alam',
                'description' => 'Destinasi demo siap pakai untuk pengujian scan QR masuk wisata pada hari ini.',
                'highlights' => 'Area hijau, spot foto, dan jalur masuk siap scan.',
                'province_code' => '32',
                'city_code' => '3273',
                'address_full' => 'Jl. Demo Scan Wisata No. 1, Bandung, Jawa Barat',
                'maps_pin_url' => 'https://maps.google.com/?q=-6.9175,107.6191',
                'open_days' => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
                'open_time' => '08:00',
                'close_time' => '20:00',
                'holiday_notes' => 'Tetap buka untuk uji coba demo scan.',
                'facilities' => ['parkir', 'toilet', 'mushola', 'pemandu'],
                'photo_gate_path' => $assets['photo_gate_path'],
                'photo_area_path' => $assets['photo_area_path'],
                'photo_ticket_path' => $assets['photo_ticket_path'],
                'contact_phone' => '081200009001',
                'contact_hours' => '08:00-20:00',
                'ktp_path' => $assets['ktp_path'],
                'selfie_ktp_path' => $assets['selfie_ktp_path'],
                'legal_doc_type' => 'nib',
                'legal_doc_number' => '9120000090010',
                'legal_doc_path' => $assets['legal_doc_path'],
                'bank_name' => 'BCA',
                'bank_account_number' => '9001009001',
                'bank_account_name' => 'Mitra Scan Wisata',
                'verification_status' => 'verified',
                'verification_reason' => 'Seeder demo scan: destinasi telah diverifikasi dan siap diuji.',
                'payout_status' => 'verified',
                'payout_reason' => 'Seeder demo scan: payout telah diverifikasi.',
                'is_live' => true,
                'is_suspended' => false,
                'suspended_reason' => null,
                'suspended_at' => null,
                'content_hidden' => false,
                'content_hidden_reason' => null,
                'photo_gate_hidden' => false,
                'photo_area_hidden' => false,
                'photo_ticket_hidden' => false,
                'is_temporarily_closed' => false,
                'closure_note' => null,
                'created_by' => $mitraUser->id,
                'updated_by' => $mitraUser->id,
            ])
        );

        $ticket = WisataTicket::query()->updateOrCreate(
            [
                'mitra_wisata_onboarding_id' => $destination->id,
                'name' => 'Tiket Scan Hari Ini',
            ],
            [
                'description' => 'Tiket demo aktif untuk uji scan QR hari ini.',
                'price' => 75000,
                'quota' => 100,
                'daily_quota' => 100,
                'ticket_type' => 'perorangan',
                'ticket_kind' => 'single',
                'package_items' => null,
                'valid_from' => today(),
                'valid_until' => today()->addMonths(2),
                'refund_policy' => 'Refund manual melalui admin.',
                'max_quota_override' => null,
                'is_active' => true,
                'is_closed' => false,
            ]
        );

        $booking = WisataBooking::query()->updateOrCreate(
            ['booking_code' => self::BOOKING_CODE],
            [
                'user_id' => $customerUser->id,
                'mitra_wisata_onboarding_id' => $destination->id,
                'wisata_ticket_id' => $ticket->id,
                'visit_date' => today(),
                'quantity' => 3,
                'unit_price' => $ticket->price,
                'subtotal_price' => $ticket->price * 3,
                'voucher_id' => null,
                'voucher_code' => null,
                'discount_type' => null,
                'discount_value' => 0,
                'discount_amount' => 0,
                'total_price' => $ticket->price * 3,
                'status' => 'paid',
                'guest_name' => $customerUser->name,
                'guest_email' => $customerUser->email,
                'guest_phone' => $customerUser->phone,
                'special_request' => 'Seeder demo scan wisata siap dipakai.',
                'payment_status' => 'settlement',
                'payment_deadline' => now()->addHours(2),
                'midtrans_order_id' => self::ORDER_ID,
                'cancel_reason' => null,
                'cancelled_at' => null,
                'cancelled_by_admin_id' => null,
                'refund_status' => 'none',
                'refund_amount' => null,
                'refund_reason' => null,
                'refund_processed_at' => null,
            ]
        );

        WisataTicketScan::query()
            ->where('wisata_booking_id', $booking->id)
            ->delete();

        $item = WisataBookingItem::query()->updateOrCreate(
            [
                'wisata_booking_id' => $booking->id,
                'wisata_ticket_id' => $ticket->id,
            ],
            [
                'ticket_name' => $ticket->name,
                'quantity' => 3,
                'used_quantity' => 0,
                'unit_price' => $ticket->price,
                'subtotal' => $ticket->price * 3,
            ]
        );

        $booking->forceFill([
            'user_id' => $customerUser->id,
            'mitra_wisata_onboarding_id' => $destination->id,
            'wisata_ticket_id' => $ticket->id,
            'visit_date' => today(),
            'quantity' => $item->quantity,
            'unit_price' => $ticket->price,
            'subtotal_price' => $ticket->price * $item->quantity,
            'total_price' => $ticket->price * $item->quantity,
            'status' => 'paid',
            'payment_status' => 'settlement',
            'payment_deadline' => now()->addHours(2),
            'midtrans_order_id' => self::ORDER_ID,
        ])->save();

        WisataPayment::query()->updateOrCreate(
            ['order_id' => self::ORDER_ID],
            [
                'wisata_booking_id' => $booking->id,
                'provider' => 'midtrans',
                'status' => 'settlement',
                'gross_amount' => $ticket->price * $item->quantity,
                'payment_type' => 'qris',
                'transaction_id' => 'trx-'.self::ORDER_ID,
                'payload' => [
                    'order_id' => self::ORDER_ID,
                    'transaction_status' => 'settlement',
                    'payment_type' => 'qris',
                    'gross_amount' => (string) ($ticket->price * $item->quantity),
                ],
            ]
        );

        $baseUrl = rtrim((string) config('app.url', 'http://localhost'), '/');

        $this->command?->info('Wisata scan demo siap digunakan.');
        $this->command?->line('Mitra wisata  : '.self::MITRA_EMAIL.' / '.self::PASSWORD);
        $this->command?->line('User pengunjung: '.self::USER_EMAIL.' / '.self::PASSWORD);
        $this->command?->line('Destinasi     : '.$destination->destination_name);
        $this->command?->line('Tiket         : '.$ticket->name);
        $this->command?->line('Booking code  : '.self::BOOKING_CODE);
        $this->command?->line('QR mitra      : '.$baseUrl.'/mitra/wisata/scans');
        $this->command?->line('Scan user     : '.$baseUrl.'/tickets/scan');
    }

    private function upsertUser(array $payload): User
    {
        return User::query()->updateOrCreate(
            ['email' => $payload['email']],
            $this->tablePayload('users', $payload)
        );
    }

    private function ensureRegions(): void
    {
        DB::table('provinces')->updateOrInsert(
            ['code' => '32'],
            ['name' => 'Jawa Barat']
        );

        DB::table('regencies')->updateOrInsert(
            ['code' => '3273'],
            [
                'province_code' => '32',
                'name' => 'Bandung',
                'type' => 'Kota',
            ]
        );
    }

    private function ensureAssets(): array
    {
        return [
            'photo_gate_path' => 'seeders/public/banner-wisata-hero.jpg',
            'photo_area_path' => 'seeders/mitra-wisata/area.jpg',
            'photo_ticket_path' => 'seeders/public/promo-wisata.jpg',
            'ktp_path' => 'seeders/tour-guide/ktp-demo.jpg',
            'selfie_ktp_path' => 'seeders/tour-guide/selfie-ktp-demo.jpg',
            'legal_doc_path' => 'seeders/public/partner-demo.jpg',
        ];
    }

    private function tablePayload(string $table, array $payload): array
    {
        foreach (array_keys($payload) as $column) {
            if (! Schema::hasColumn($table, $column)) {
                unset($payload[$column]);
            }
        }

        return $payload;
    }
}
