<?php

use App\Models\SystemSetting;
use App\Models\User;
use App\Services\MaintenanceMode;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('admin can update booking timeout per product', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);

    $this->actingAs($admin)
        ->post('/admin/system/settings', [
            'hotel_booking_timeout_minutes' => 20,
            'wisata_booking_timeout_minutes' => 25,
            'event_booking_timeout_minutes' => 30,
            'academy_booking_timeout_minutes' => 35,
            'special_program_booking_timeout_minutes' => 40,
            'retail_shop_booking_timeout_minutes' => 45,
            'public_whatsapp_number' => '6281292059888',
            MaintenanceMode::ENABLED_KEY => false,
            MaintenanceMode::MESSAGE_KEY => 'Sistem sedang maintenance.',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect(SystemSetting::query()->where('key', 'hotel_booking_timeout_minutes')->value('value'))->toBe('20')
        ->and(SystemSetting::query()->where('key', 'booking_timeout_minutes')->value('value'))->toBe('20')
        ->and(SystemSetting::query()->where('key', 'wisata_booking_timeout_minutes')->value('value'))->toBe('25')
        ->and(SystemSetting::query()->where('key', 'event_booking_timeout_minutes')->value('value'))->toBe('30')
        ->and(SystemSetting::query()->where('key', 'academy_booking_timeout_minutes')->value('value'))->toBe('35')
        ->and(SystemSetting::query()->where('key', 'special_program_booking_timeout_minutes')->value('value'))->toBe('40')
        ->and(SystemSetting::query()->where('key', 'retail_shop_booking_timeout_minutes')->value('value'))->toBe('45')
        ->and(SystemSetting::query()->where('key', 'public_whatsapp_number')->value('value'))->toBe('6281292059888');
});
