<?php

namespace Database\Seeders;

use App\Models\MitraWisataOnboarding;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class MitraDemoUserSeeder extends Seeder
{
    public function run(): void
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
                'province_code' => '32',
                'city_code' => '3273',
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
