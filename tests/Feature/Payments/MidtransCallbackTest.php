<?php

use App\Models\Booking;
use App\Models\BookingRoom;
use App\Models\Event;
use App\Models\EventBooking;
use App\Models\EventOrganizer;
use App\Models\EventPayment;
use App\Models\EventTicket;
use App\Models\Hotel;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;
use App\Models\RoomInventory;
use App\Models\RoomType;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function midtransPayload(string $orderId, string $status, string $grossAmount = '100000.00', string $paymentType = 'bank_transfer'): array
{
    config(['services.midtrans.server_key' => 'test-server-key']);

    return [
        'order_id' => $orderId,
        'status_code' => '200',
        'gross_amount' => $grossAmount,
        'signature_key' => hash('sha512', $orderId.'200'.$grossAmount.'test-server-key'),
        'transaction_status' => $status,
        'payment_type' => $paymentType,
        'transaction_id' => 'trx-'.$orderId,
    ];
}

function createHotelBookingFixture(string $orderId = 'HOTEL-ORDER-1'): array
{
    $user = User::factory()->create();
    DB::table('provinces')->insert(['code' => '35', 'name' => 'Jawa Timur']);
    DB::table('regencies')->insert(['code' => '3501', 'province_code' => '35', 'name' => 'Pacitan', 'type' => 'Kabupaten']);

    $hotel = Hotel::query()->create([
        'vendor_id' => $user->id,
        'name' => 'Hotel Test',
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

    $booking = Booking::query()->create([
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
        'midtrans_order_id' => $orderId,
        'payment_status' => 'pending',
    ]);

    BookingRoom::query()->create([
        'booking_id' => $booking->id,
        'room_type_id' => $roomType->id,
        'rooms_count' => 1,
        'price_per_night' => 100000,
        'subtotal' => 100000,
    ]);

    Payment::query()->create([
        'booking_id' => $booking->id,
        'provider' => 'midtrans',
        'status' => 'pending',
        'gross_amount' => 100000,
        'order_id' => $orderId,
    ]);

    return [$user, $hotel, $roomType, $booking];
}

test('midtrans callback works through normal middleware stack without csrf token', function () {
    [$user, , , $booking] = createHotelBookingFixture('HOTEL-CSRF-OK-1');

    $this->post('/payments/midtrans/callback', midtransPayload('HOTEL-CSRF-OK-1', 'settlement'))
        ->assertOk()
        ->assertSee('OK');

    $booking->refresh();
    $payment = Payment::query()->where('booking_id', $booking->id)->firstOrFail();

    expect($booking->status)->toBe('paid');
    expect($booking->payment_status)->toBe('settlement');
    expect($payment->status)->toBe('settlement');

    $this->assertDatabaseHas('user_notifications', [
        'user_id' => $user->id,
        'type' => 'payment_paid',
        'title' => 'Pembayaran berhasil',
    ]);
});

test('midtrans callback rejects invalid signature without mutating booking', function () {
    [, , , $booking] = createHotelBookingFixture('HOTEL-BAD-SIGNATURE');

    $this->withoutMiddleware()
        ->post('/payments/midtrans/callback', [
            ...midtransPayload('HOTEL-BAD-SIGNATURE', 'settlement'),
            'signature_key' => 'invalid-signature',
        ])
        ->assertStatus(400)
        ->assertSee('Invalid signature');

    $booking->refresh();
    expect($booking->status)->toBe('pending_payment');
    expect(UserNotification::query()->count())->toBe(0);
});

test('midtrans callback rejects gross amount mismatch without mutating booking', function () {
    [, , , $booking] = createHotelBookingFixture('HOTEL-AMOUNT-MISMATCH');

    $this->withoutMiddleware()
        ->post('/payments/midtrans/callback', midtransPayload('HOTEL-AMOUNT-MISMATCH', 'settlement', '1.00'))
        ->assertStatus(422)
        ->assertSee('Amount mismatch');

    $booking->refresh();
    $payment = Payment::query()->where('booking_id', $booking->id)->firstOrFail();

    expect($booking->status)->toBe('pending_payment')
        ->and($booking->payment_status)->toBe('pending')
        ->and($payment->status)->toBe('pending')
        ->and(UserNotification::query()->count())->toBe(0);
});

test('midtrans settlement marks hotel booking paid and creates notification', function () {
    [$user, , , $booking] = createHotelBookingFixture('HOTEL-PAID-1');

    $this->withoutMiddleware()
        ->post('/payments/midtrans/callback', midtransPayload('HOTEL-PAID-1', 'settlement'))
        ->assertOk()
        ->assertSee('OK');

    $booking->refresh();
    $payment = Payment::query()->where('booking_id', $booking->id)->firstOrFail();

    expect($booking->status)->toBe('paid');
    expect($booking->payment_status)->toBe('settlement');
    expect($payment->status)->toBe('settlement');
    expect($payment->payment_type)->toBe('bank_transfer');

    $this->assertDatabaseHas('user_notifications', [
        'user_id' => $user->id,
        'type' => 'payment_paid',
        'title' => 'Pembayaran berhasil',
    ]);
});

test('late non success callback does not downgrade paid hotel booking', function () {
    [$user, , , $booking] = createHotelBookingFixture('HOTEL-LATE-EXPIRE');

    $this->withoutMiddleware()
        ->post('/payments/midtrans/callback', midtransPayload('HOTEL-LATE-EXPIRE', 'settlement'))
        ->assertOk();

    $this->withoutMiddleware()
        ->post('/payments/midtrans/callback', midtransPayload('HOTEL-LATE-EXPIRE', 'expire'))
        ->assertOk();

    $booking->refresh();
    $payment = Payment::query()->where('booking_id', $booking->id)->firstOrFail();

    expect($booking->status)->toBe('paid')
        ->and($booking->payment_status)->toBe('settlement')
        ->and($payment->status)->toBe('settlement')
        ->and(UserNotification::query()->where('user_id', $user->id)->where('type', 'payment_paid')->count())->toBe(1)
        ->and(UserNotification::query()->where('user_id', $user->id)->where('type', 'booking_expired')->count())->toBe(0);
});

test('midtrans expired hotel booking releases room inventory and notifies user', function () {
    [$user, , $roomType, $booking] = createHotelBookingFixture('HOTEL-EXPIRED-1');

    RoomInventory::query()->create([
        'room_type_id' => $roomType->id,
        'date' => $booking->check_in->toDateString(),
        'available_rooms' => 4,
        'price' => 100000,
    ]);

    $this->withoutMiddleware()
        ->post('/payments/midtrans/callback', midtransPayload('HOTEL-EXPIRED-1', 'expire'))
        ->assertOk();

    $booking->refresh();
    $inventory = RoomInventory::query()->where('room_type_id', $roomType->id)->whereDate('date', $booking->check_in)->firstOrFail();

    expect($booking->status)->toBe('expired');
    expect($booking->payment_status)->toBe('expire');
    expect($inventory->available_rooms)->toBe(5);

    $this->assertDatabaseHas('user_notifications', [
        'user_id' => $user->id,
        'type' => 'booking_expired',
    ]);
});

test('event settlement increments sold counters only once on duplicate callbacks', function () {
    $user = User::factory()->create();
    $organizer = EventOrganizer::query()->create([
        'name' => 'Organizer Test',
        'status' => 'verified',
    ]);
    $event = Event::query()->create([
        'event_organizer_id' => $organizer->id,
        'title' => 'Event Test',
        'status' => 'published',
        'published_at' => now(),
        'start_at' => now()->addWeek(),
        'capacity_total' => 100,
        'capacity_sold' => 0,
    ]);
    $ticket = EventTicket::query()->create([
        'event_id' => $event->id,
        'name' => 'Regular',
        'price' => 50000,
        'is_active' => true,
        'quota' => 100,
        'sold_count' => 0,
    ]);
    $booking = EventBooking::query()->create([
        'user_id' => $user->id,
        'event_id' => $event->id,
        'event_ticket_id' => $ticket->id,
        'booking_code' => 'EVT-BOOK-1',
        'quantity' => 2,
        'total_price' => 100000,
        'status' => 'pending_payment',
        'payment_status' => 'pending',
        'payment_deadline' => now()->addMinutes(15),
        'midtrans_order_id' => 'EVENT-PAID-1',
    ]);
    EventPayment::query()->create([
        'event_booking_id' => $booking->id,
        'provider' => 'midtrans',
        'status' => 'pending',
        'gross_amount' => 100000,
        'order_id' => 'EVENT-PAID-1',
    ]);

    $payload = midtransPayload('EVENT-PAID-1', 'settlement');

    $this->withoutMiddleware()->post('/payments/midtrans/callback', $payload)->assertOk();
    $this->withoutMiddleware()->post('/payments/midtrans/callback', $payload)->assertOk();

    $booking->refresh();
    $ticket->refresh();
    $event->refresh();

    expect($booking->status)->toBe('paid');
    expect($ticket->sold_count)->toBe(2);
    expect($event->capacity_sold)->toBe(2);
    expect(UserNotification::query()->where('user_id', $user->id)->where('type', 'event_payment_paid')->count())->toBe(1);
});
