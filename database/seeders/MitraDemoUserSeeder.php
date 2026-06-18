<?php

namespace Database\Seeders;

use App\Models\EventOrganizer;
use App\Models\Hotel;
use App\Models\MitraEventOnboarding;
use App\Models\MitraOnboarding;
use App\Models\MitraWisataOnboarding;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class MitraDemoUserSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedHotelMitra();
        $this->seedWisataMitra();
        $this->seedEventMitra();
    }

    private function seedHotelMitra(): void
    {
        $user = $this->activeMitraUser(
            name: 'Mitra Hotel Indotix',
            email: 'mitra.hotel@indotix.id',
            phone: '081200000101',
            type: 'hotel',
        );

        MitraOnboarding::query()->updateOrCreate(
            ['user_id' => $user->id],
            $this->tablePayload('mitra_onboardings', [
                'current_step' => 3,
                'hotel_name' => 'Hotel Demo Indotix',
                'property_type' => 'hotel',
                'city_code' => $this->cityCode(),
                'address_short' => 'Jl. Asia Afrika No. 10',
                'estimated_room_count' => 24,
                'responsible_name' => $user->name,
                'responsible_nik' => '3273010101900001',
                'responsible_role' => 'owner',
                'ktp_path' => 'seeders/mitra-hotel/ktp.jpg',
                'selfie_ktp_path' => 'seeders/mitra-hotel/selfie-ktp.jpg',
                'legal_doc_type' => 'nib',
                'legal_doc_number' => '9120000001010',
                'legal_doc_path' => 'seeders/mitra-hotel/nib.pdf',
                'photo_front_path' => 'seeders/mitra-hotel/front.jpg',
                'photo_lobby_path' => 'seeders/mitra-hotel/lobby.jpg',
                'photo_room_path' => 'seeders/mitra-hotel/room.jpg',
                'address_full' => 'Jl. Asia Afrika No. 10, Bandung, Jawa Barat',
                'maps_pin_url' => 'https://maps.google.com/?q=-6.9219,107.6070',
                'reception_phone' => '022-1000101',
                'operational_hours' => '24 jam',
                'reservation_pic' => 'Reservasi Hotel Demo',
                'verification_status' => 'verified',
                'verification_reason' => 'Seeder: dokumen lengkap dan diverifikasi.',
                'bank_name' => 'BCA',
                'bank_account_number' => '1010101010',
                'bank_account_name' => 'PT Hotel Demo Indotix',
                'tax_npwp' => '12.345.678.9-101.000',
                'tax_type' => 'badan',
                'payout_status' => 'verified',
                'payout_reason' => 'Seeder: rekening payout terverifikasi.',
            ]),
        );

        Hotel::query()->updateOrCreate(
            ['vendor_id' => $user->id, 'name' => 'Hotel Demo Indotix'],
            $this->tablePayload('hotels', [
                'description' => 'Hotel demo aktif untuk pengujian akun mitra hotel.',
                'city_id' => $this->cityCode(),
                'address' => 'Jl. Asia Afrika No. 10, Bandung, Jawa Barat',
                'latitude' => -6.9219,
                'longitude' => 107.6070,
                'star_rating' => 4,
                'check_in_time' => '14:00',
                'check_out_time' => '12:00',
                'status' => 'active',
            ]),
        );
    }

    private function seedWisataMitra(): void
    {
        $user = $this->activeMitraUser(
            name: 'Mitra Wisata Indotix',
            email: 'mitra.wisata@indotix.id',
            phone: '081200000202',
            type: 'wisata',
        );

        MitraWisataOnboarding::query()->updateOrCreate(
            ['user_id' => $user->id],
            $this->tablePayload('mitra_wisata_onboardings', [
                'current_step' => 3,
                'responsible_name' => $user->name,
                'responsible_phone' => $user->phone,
                'responsible_role' => 'owner',
                'destination_name' => 'Wisata Demo Indotix',
                'destination_type' => 'edukasi',
                'description' => 'Destinasi demo aktif untuk pengujian akun mitra wisata.',
                'highlights' => 'Area edukasi, spot foto, dan pemandu lokal.',
                'province_code' => $this->provinceCode(),
                'city_code' => $this->cityCode(),
                'address_full' => 'Jl. Wisata Demo No. 20, Bandung, Jawa Barat',
                'maps_pin_url' => 'https://maps.google.com/?q=-6.9034,107.6186',
                'open_days' => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
                'open_time' => '08:00',
                'close_time' => '17:00',
                'holiday_notes' => 'Tetap buka saat libur nasional.',
                'facilities' => ['toilet', 'mushola', 'parkir', 'pemandu'],
                'photo_gate_path' => 'seeders/mitra-wisata/gate.jpg',
                'photo_area_path' => 'seeders/mitra-wisata/area.jpg',
                'photo_ticket_path' => 'seeders/mitra-wisata/ticket.jpg',
                'contact_phone' => '081200000202',
                'contact_hours' => '08:00-17:00',
                'ktp_path' => 'seeders/mitra-wisata/ktp.jpg',
                'selfie_ktp_path' => 'seeders/mitra-wisata/selfie-ktp.jpg',
                'legal_doc_type' => 'nib',
                'legal_doc_number' => '9120000002020',
                'legal_doc_path' => 'seeders/mitra-wisata/nib.pdf',
                'bank_name' => 'Mandiri',
                'bank_account_number' => '2020202020',
                'bank_account_name' => 'Wisata Demo Indotix',
                'verification_status' => 'verified',
                'verification_reason' => 'Seeder: dokumen lengkap dan diverifikasi.',
                'payout_status' => 'verified',
                'payout_reason' => 'Seeder: rekening payout terverifikasi.',
                'is_live' => true,
                'is_suspended' => false,
                'content_hidden' => false,
                'photo_gate_hidden' => false,
                'photo_area_hidden' => false,
                'photo_ticket_hidden' => false,
                'is_temporarily_closed' => false,
            ]),
        );
    }

    private function seedEventMitra(): void
    {
        $user = $this->activeMitraUser(
            name: 'Mitra Event Indotix',
            email: 'mitra.event@indotix.id',
            phone: '081200000303',
            type: 'event',
        );

        MitraEventOnboarding::query()->updateOrCreate(
            ['user_id' => $user->id],
            $this->tablePayload('mitra_event_onboardings', [
                'current_step' => 3,
                'responsible_name' => $user->name,
                'responsible_phone' => $user->phone,
                'responsible_role' => 'owner',
                'eo_name' => 'Event Organizer Demo Indotix',
                'organizer_type' => 'eo_profesional',
                'founded_year' => 2020,
                'eo_description' => 'Event organizer demo aktif untuk pengujian akun mitra event.',
                'legal_doc_type' => 'nib_siup_akta',
                'legal_doc_number' => '9120000003030',
                'legal_doc_path' => 'seeders/mitra-event/legal.pdf',
                'ktp_path' => 'seeders/mitra-event/ktp.jpg',
                'selfie_ktp_path' => 'seeders/mitra-event/selfie-ktp.jpg',
                'bank_name' => 'BNI',
                'bank_account_number' => '3030303030',
                'bank_account_name' => 'Event Organizer Demo Indotix',
                'bank_account_relation' => 'perusahaan',
                'operational_phone' => '081200000303',
                'operational_email' => 'mitra.event@indotix.id',
                'operational_hours' => '09:00-18:00',
                'verification_status' => 'verified',
                'verification_reason' => 'Seeder: dokumen lengkap dan diverifikasi.',
            ]),
        );

        EventOrganizer::query()->updateOrCreate(
            ['user_id' => $user->id],
            $this->tablePayload('event_organizers', [
                'name' => 'Event Organizer Demo Indotix',
                'email' => 'mitra.event@indotix.id',
                'phone' => '081200000303',
                'status' => 'verified',
                'notes' => 'Seeder: organizer aktif dan terverifikasi.',
                'documents' => [
                    'legal_doc' => 'seeders/mitra-event/legal.pdf',
                    'ktp' => 'seeders/mitra-event/ktp.jpg',
                    'bank' => 'verified',
                ],
            ]),
        );
    }

    private function activeMitraUser(string $name, string $email, string $phone, string $type): User
    {
        $payload = [
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'gender' => 'other',
            'email_verified_at' => now(),
            'password' => 'password',
            'role' => 'mitra',
            'mitra_onboarding_type' => $type,
            'is_suspended' => false,
            'suspended_at' => null,
            'suspended_reason' => null,
        ];

        foreach (array_keys($payload) as $column) {
            if (! Schema::hasColumn('users', $column)) {
                unset($payload[$column]);
            }
        }

        return User::query()->updateOrCreate(['email' => $email], $payload);
    }

    private function cityCode(): string
    {
        return '3273';
    }

    private function provinceCode(): string
    {
        return '32';
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
