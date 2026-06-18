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
            'booking_timeout_minutes' => 15,
            'tax_rate' => 0,
            'service_fee' => 0,
            'wisata_booking_timeout_minutes' => 15,
            'wisata_max_quota_per_ticket' => 1000,
            'wisata_refund_policy' => 'Manual review',
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
        ->from('/stay')
        ->post('/booking/prepare', [
            'hotel_id' => 1,
            'room_type_id' => 1,
            'check_in' => now()->addDay()->toDateString(),
            'check_out' => now()->addDays(2)->toDateString(),
            'rooms' => 1,
            'guests' => 2,
        ])
        ->assertRedirect('/stay')
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
        ->postJson('/api/hotel/bookings/quote', [
            'hotel_id' => '1',
            'room_type_id' => '1',
            'check_in' => now()->addDay()->toDateString(),
            'check_out' => now()->addDays(2)->toDateString(),
            'rooms' => 1,
            'guests' => 2,
        ])
        ->assertStatus(503)
        ->assertJsonPath('maintenance', true)
        ->assertJsonPath('message', 'Transaksi mobile sedang ditutup sementara.');
});
