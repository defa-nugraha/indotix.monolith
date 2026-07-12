<?php

use App\Models\SystemSetting;
use App\Models\User;
use App\Services\MaintenanceMode;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function enableMaintenanceForTest(string $message = 'Maintenance test message.'): void
{
    SystemSetting::query()->updateOrCreate(
        ['key' => MaintenanceMode::ENABLED_KEY],
        ['value' => '1', 'type' => 'boolean']
    );
    SystemSetting::query()->updateOrCreate(
        ['key' => MaintenanceMode::MESSAGE_KEY],
        ['value' => $message, 'type' => 'string']
    );
}

test('admin can update maintenance mode settings', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);

    $this->actingAs($admin)
        ->post('/admin/system/settings', [
            'hotel_booking_timeout_minutes' => 15,
            'wisata_booking_timeout_minutes' => 15,
            'event_booking_timeout_minutes' => 15,
            'academy_booking_timeout_minutes' => 15,
            'special_program_booking_timeout_minutes' => 15,
            'retail_shop_booking_timeout_minutes' => 15,
            MaintenanceMode::ENABLED_KEY => true,
            MaintenanceMode::MESSAGE_KEY => 'Sistem sedang maintenance untuk peningkatan layanan.',
        ])
        ->assertRedirect();

    expect(app(MaintenanceMode::class)->isEnabled())->toBeTrue()
        ->and(app(MaintenanceMode::class)->message())->toBe('Sistem sedang maintenance untuk peningkatan layanan.');
});

test('web transaction routes are blocked during maintenance', function () {
    enableMaintenanceForTest('Transaksi web sedang ditutup sementara.');

    $user = User::factory()->create([
        'role' => 'user',
        'email_verified_at' => now(),
    ]);

    $this->actingAs($user)
        ->from('/wisata')
        ->post('/wisata/booking/prepare', [
            'destination_id' => 1,
            'ticket_id' => 1,
            'visit_date' => now()->addDay()->toDateString(),
            'quantity' => 1,
        ])
        ->assertRedirect('/wisata')
        ->assertSessionHasErrors([
            'maintenance' => 'Transaksi web sedang ditutup sementara.',
        ]);
});

test('mobile transaction routes return maintenance response', function () {
    enableMaintenanceForTest('Transaksi mobile sedang ditutup sementara.');

    $user = User::factory()->create([
        'role' => 'user',
        'email_verified_at' => now(),
    ]);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/wisata/bookings/quote', [
            'destination_id' => '1',
            'ticket_id' => '1',
            'visit_date' => now()->addDay()->toDateString(),
            'quantity' => 1,
        ])
        ->assertStatus(503)
        ->assertJsonPath('maintenance', true)
        ->assertJsonPath('message', 'Transaksi mobile sedang ditutup sementara.');
});
