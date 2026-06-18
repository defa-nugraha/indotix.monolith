<?php

use App\Models\Booking;
use App\Models\BookingRoom;
use App\Models\Hotel;
use App\Models\Payment;
use App\Models\RoomInventory;
use App\Models\RoomType;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

function createApiHotelPaymentFixture(array $bookingOverrides = [], ?array $paymentPayload = null): array
{
    $user = User::factory()->create();

    DB::table('provinces')->insertOrIgnore([
        'code' => '35',
        'name' => 'Jawa Timur',
    ]);
    DB::table('regencies')->insertOrIgnore([
        'code' => '3501',
        'province_code' => '35',
        'name' => 'Pacitan',
        'type' => 'Kabupaten',
    ]);

    $hotel = Hotel::query()->create([
        'vendor_id' => $user->id,
        'name' => 'Hotel API Payment',
        'city_id' => '3501',
        'address' => 'Jl. Test',
        'status' => 'published',
    ]);

    $roomType = RoomType::query()->create([
        'hotel_id' => $hotel->id,
        'name' => 'Deluxe',
        'base_price' => 100000,
        'total_rooms' => 5,
        'status' => 'published',
    ]);

    $booking = Booking::query()->create(array_merge([
        'user_id' => $user->id,
        'hotel_id' => $hotel->id,
        'check_in' => now()->addDay()->toDateString(),
        'check_out' => now()->addDays(2)->toDateString(),
        'nights' => 1,
        'rooms_count' => 1,
        'guests_count' => 2,
        'subtotal' => 100000,
        'total' => 100000,
        'status' => 'pending_payment',
        'payment_deadline' => now()->addMinutes(15),
        'payment_status' => 'pending',
    ], $bookingOverrides));

    BookingRoom::query()->create([
        'booking_id' => $booking->id,
        'room_type_id' => $roomType->id,
        'rooms_count' => 1,
        'price_per_night' => 100000,
        'subtotal' => 100000,
    ]);

    RoomInventory::query()->create([
        'room_type_id' => $roomType->id,
        'date' => $booking->check_in->toDateString(),
        'available_rooms' => 4,
        'price' => 100000,
    ]);

    $payment = null;
    if ($paymentPayload !== null) {
        $payment = Payment::query()->create([
            'booking_id' => $booking->id,
            'provider' => 'midtrans',
            'status' => 'pending',
            'gross_amount' => 100000,
            'payment_type' => 'snap',
            'order_id' => $paymentPayload['order_id'] ?? 'INDOTIX-API-TEST',
            'payload' => $paymentPayload,
        ]);

        $booking->update([
            'midtrans_order_id' => $payment->order_id,
            'payment_status' => $payment->status,
        ]);
    }

    return [$user, $booking->refresh(), $roomType, $payment];
}

test('mobile hotel payment endpoint reuses existing pending payment', function () {
    [$user, $booking] = createApiHotelPaymentFixture(paymentPayload: [
        'order_id' => 'INDOTIX-REUSE-1',
        'token' => 'snap-token-reuse',
        'redirect_url' => 'https://app.sandbox.midtrans.com/snap/v2/vtweb/snap-token-reuse',
    ]);

    $this->actingAs($user, 'sanctum')
        ->postJson("/api/hotel/bookings/{$booking->id}/pay")
        ->assertOk()
        ->assertJsonPath('payment.order_id', 'INDOTIX-REUSE-1')
        ->assertJsonPath('payment.snap_token', 'snap-token-reuse')
        ->assertJsonPath('payment.redirect_url', 'https://app.sandbox.midtrans.com/snap/v2/vtweb/snap-token-reuse');

    expect(Payment::query()->where('booking_id', $booking->id)->count())->toBe(1);
});

test('mobile hotel payment endpoint expires overdue booking and releases inventory', function () {
    [$user, $booking, $roomType] = createApiHotelPaymentFixture([
        'payment_deadline' => now()->subMinute(),
    ]);

    $this->actingAs($user, 'sanctum')
        ->postJson("/api/hotel/bookings/{$booking->id}/pay")
        ->assertStatus(422)
        ->assertJsonPath('message', 'Booking sudah kedaluwarsa.');

    $booking->refresh();
    $inventory = RoomInventory::query()
        ->where('room_type_id', $roomType->id)
        ->whereDate('date', $booking->check_in)
        ->firstOrFail();

    expect($booking->status)->toBe('expired');
    expect($booking->payment_status)->toBe('expired');
    expect($inventory->available_rooms)->toBe(5);
    expect(UserNotification::query()->where('user_id', $user->id)->where('type', 'booking_expired')->exists())->toBeTrue();
});
