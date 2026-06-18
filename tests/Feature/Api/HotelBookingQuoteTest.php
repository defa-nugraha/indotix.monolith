<?php

use App\Models\Hotel;
use App\Models\HotelTax;
use App\Models\RoomInventory;
use App\Models\RoomType;
use App\Models\SystemSetting;
use App\Models\User;
use App\Services\BookingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

uses(RefreshDatabase::class);

function createApiHotelQuoteFixture(): array
{
    $user = User::factory()->create();
    $vendor = User::factory()->create(['role' => 'mitra_hotel']);

    DB::table('provinces')->insertOrIgnore([
        'code' => '32',
        'name' => 'Jawa Barat',
    ]);
    DB::table('regencies')->insertOrIgnore([
        'code' => '3273',
        'province_code' => '32',
        'name' => 'Bandung',
        'type' => 'Kota',
    ]);

    $hotel = Hotel::query()->create([
        'vendor_id' => $vendor->id,
        'name' => 'Hotel Quote Test',
        'city_id' => '3273',
        'address' => 'Jl. Quote',
        'status' => 'active',
    ]);

    $roomType = RoomType::query()->create([
        'hotel_id' => $hotel->id,
        'name' => 'Deluxe',
        'max_guest' => 2,
        'included_adults' => 2,
        'extra_bed_max' => 0,
        'base_price' => 250000,
        'total_rooms' => 5,
        'status' => 'active',
    ]);

    RoomInventory::query()->create([
        'room_type_id' => $roomType->id,
        'date' => '2026-06-14',
        'available_rooms' => 5,
        'price_override' => 300000,
        'is_closed' => false,
    ]);

    HotelTax::query()->create([
        'hotel_id' => $hotel->id,
        'name' => 'Pajak Hotel',
        'rate' => 10,
    ]);

    SystemSetting::query()->create([
        'key' => 'service_fee',
        'value' => '5000',
        'type' => 'number',
    ]);

    return [$user, $hotel, $roomType];
}

test('mobile hotel quote returns pricing from available room inventory', function () {
    [$user, $hotel, $roomType] = createApiHotelQuoteFixture();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/hotel/bookings/quote', [
            'hotel_id' => (string) $hotel->id,
            'room_type_id' => (string) $roomType->id,
            'check_in' => '2026-06-14',
            'check_out' => '2026-06-15',
            'rooms' => 1,
            'guests' => 2,
        ])
        ->assertOk()
        ->assertJsonPath('pricing.nights', 1)
        ->assertJsonPath('pricing.subtotal', 300000)
        ->assertJsonPath('pricing.tax_total', 30000)
        ->assertJsonPath('pricing.service_fee', 5000)
        ->assertJsonPath('pricing.total', 335000);
});

test('mobile hotel quote returns clear validation when inventory is unavailable', function () {
    [$user, $hotel, $roomType] = createApiHotelQuoteFixture();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/hotel/bookings/quote', [
            'hotel_id' => (string) $hotel->id,
            'room_type_id' => (string) $roomType->id,
            'check_in' => '2026-06-15',
            'check_out' => '2026-06-16',
            'rooms' => 1,
            'guests' => 2,
        ])
        ->assertStatus(422)
        ->assertJsonPath('message', 'Inventory tidak tersedia untuk tanggal ini.');
});

test('mobile hotel quote logs unexpected server failures with a friendly message', function () {
    [$user, $hotel, $roomType] = createApiHotelQuoteFixture();

    $bookingService = Mockery::mock(BookingService::class);
    $bookingService
        ->shouldReceive('calculatePricing')
        ->once()
        ->andThrow(new Exception('Simulated quote failure'));
    app()->instance(BookingService::class, $bookingService);

    Log::shouldReceive('error')
        ->once()
        ->withArgs(fn (string $message, array $context) => $message === 'Hotel booking quote failed'
            && $context['user_id'] === $user->id
            && $context['context'] === 'quote'
            && $context['message'] === 'Simulated quote failure'
        );

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/hotel/bookings/quote', [
            'hotel_id' => (string) $hotel->id,
            'room_type_id' => (string) $roomType->id,
            'check_in' => '2026-06-14',
            'check_out' => '2026-06-15',
            'rooms' => 1,
            'guests' => 2,
        ])
        ->assertStatus(500)
        ->assertJsonPath('message', 'Gagal menghitung ringkasan pemesanan. Silakan coba lagi.');
});
