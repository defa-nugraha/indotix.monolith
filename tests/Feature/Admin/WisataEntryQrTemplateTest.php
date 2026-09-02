<?php

use App\Models\MitraWisataOnboarding;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

function fakeQrTemplatePng(string $name): UploadedFile
{
    $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=');

    return UploadedFile::fake()->createWithContent($name, $png);
}

it('allows admin to manage wisata entry qr template content', function () {
    Storage::fake('public');

    $admin = User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);

    $this->actingAs($admin)
        ->post('/admin/public/entry-qr', [
            '_method' => 'put',
            'scan_label' => 'Scan Masuk',
            'lead_text' => 'Gunakan menu Scan Tiket Indotix untuk validasi kunjungan.',
            'main_title' => 'QR VALIDASI TIKET WISATA',
            'main_description' => 'Tempel QR di loket. User memilih tiket paid setelah scan.',
            'website_label' => 'indotix.co.id',
            'footer_step_one' => 'Scan QR',
            'footer_step_two' => 'Pilih Tiket',
            'footer_step_three' => 'Validasi',
            'top_logo_1' => fakeQrTemplatePng('logo-1.png'),
            'top_logo_2' => fakeQrTemplatePng('logo-2.png'),
            'top_logo_3' => fakeQrTemplatePng('logo-3.png'),
            'qr_logo' => fakeQrTemplatePng('qr-logo.png'),
        ])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('status', 'entry-qr-template-updated');

    expect(SystemSetting::query()->where('key', 'wisata_entry_qr_scan_label')->value('value'))->toBe('Scan Masuk');
    expect(SystemSetting::query()->where('key', 'wisata_entry_qr_top_logo_1')->value('value'))->toStartWith('wisata-entry-qr/');
    expect(SystemSetting::query()->where('key', 'wisata_entry_qr_qr_logo')->value('value'))->toStartWith('wisata-entry-qr/');
});

it('rejects qr template text that exceeds layout character limits', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);

    $this->actingAs($admin)
        ->post('/admin/public/entry-qr', [
            '_method' => 'put',
            'scan_label' => str_repeat('A', 25),
            'lead_text' => 'Gunakan menu Scan Tiket Indotix untuk validasi kunjungan.',
            'main_title' => 'QR VALIDASI TIKET WISATA',
            'main_description' => 'Tempel QR di loket. User memilih tiket paid setelah scan.',
            'website_label' => 'indotix.co.id',
            'footer_step_one' => 'Scan QR',
            'footer_step_two' => 'Pilih Tiket',
            'footer_step_three' => 'Validasi',
        ])
        ->assertSessionHasErrors('scan_label');
});

it('passes database qr template content to mitra qr page', function () {
    $mitra = User::factory()->create([
        'role' => 'mitra',
        'mitra_onboarding_type' => 'wisata',
        'email_verified_at' => now(),
    ]);

    MitraWisataOnboarding::query()->create([
        'user_id' => $mitra->id,
        'current_step' => 3,
        'destination_name' => 'Wisata QR Test',
        'destination_type' => 'alam',
        'verification_status' => 'verified',
        'payout_status' => 'verified',
        'is_suspended' => false,
    ]);

    SystemSetting::query()->create([
        'key' => 'wisata_entry_qr_scan_label',
        'value' => 'Scan Custom',
        'type' => 'string',
    ]);

    $this->actingAs($mitra)
        ->get('/mitra/wisata/scans')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('mitra/wisata/scans/index')
            ->where('qrTemplate.scan_label', 'Scan Custom'));
});
