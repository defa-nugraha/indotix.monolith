<?php

use App\Models\SystemSetting;
use App\Models\User;
use App\Services\MaintenanceMode;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('admin can update active wisata booking timeout and public contact settings', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);

    $this->actingAs($admin)
        ->post('/admin/system/settings', [
            'wisata_booking_timeout_minutes' => 25,
            'public_whatsapp_number' => '6281292059888',
            MaintenanceMode::ENABLED_KEY => false,
            MaintenanceMode::MESSAGE_KEY => 'Sistem sedang maintenance.',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect(SystemSetting::query()->where('key', 'booking_timeout_minutes')->value('value'))->toBe('25')
        ->and(SystemSetting::query()->where('key', 'wisata_booking_timeout_minutes')->value('value'))->toBe('25')
        ->and(SystemSetting::query()->where('key', 'public_whatsapp_number')->value('value'))->toBe('6281292059888');
});
