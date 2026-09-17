<?php

use App\Models\Booking;
use App\Models\BookingRoom;
use App\Models\Event;
use App\Models\EventBooking;
use App\Models\EventCommission;
use App\Models\EventOrganizer;
use App\Models\EventPayment;
use App\Models\EventTicket;
use App\Models\Hotel;
use App\Models\MitraOnboarding;
use App\Models\MitraWisataOnboarding;
use App\Models\Payment;
use App\Models\RoomType;
use App\Models\User;
use App\Models\WisataBooking;
use App\Models\WisataCommissionRule;
use App\Models\WisataPayment;
use App\Models\WisataTicket;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    Mail::fake();
    Queue::fake();
});

function partnerBalanceMidtransPayload(string $orderId, int $grossAmount): array
{
    config(['services.midtrans.server_key' => 'test-server-key']);
    $grossAmountText = number_format($grossAmount, 2, '.', '');

    return [
        'order_id' => $orderId,
        'status_code' => '200',
        'gross_amount' => $grossAmountText,
        'signature_key' => hash('sha512', $orderId.'200'.$grossAmountText.'test-server-key'),
        'transaction_status' => 'settlement',
        'payment_type' => 'bank_transfer',
        'transaction_id' => 'trx-'.$orderId,
    ];
}

function partnerBalanceBuyer(): User
{
    return User::factory()->create([
        'role' => 'user',
        'email_verified_at' => now(),
    ]);
}

function partnerBalanceHotelMitra(): User
{
    $mitra = User::factory()->create([
        'role' => 'mitra',
        'mitra_onboarding_type' => 'hotel',
        'email_verified_at' => now(),
    ]);

    MitraOnboarding::query()->create([
        'user_id' => $mitra->id,
        'current_step' => 3,
        'verification_status' => 'verified',
        'payout_status' => 'verified',
    ]);

    return $mitra;
}

function partnerBalanceWisataMitra(): array
{
    $mitra = User::factory()->create([
        'role' => 'mitra',
        'mitra_onboarding_type' => 'wisata',
        'email_verified_at' => now(),
    ]);

    $destination = MitraWisataOnboarding::query()->create([
        'user_id' => $mitra->id,
        'current_step' => 3,
        'destination_name' => 'Wisata Saldo Test',
        'destination_type' => 'alam',
        'verification_status' => 'verified',
        'payout_status' => 'verified',
    ]);

    return [$mitra, $destination];
}

function partnerBalanceEventMitra(): array
{
    $mitra = User::factory()->create([
        'role' => 'mitra',
        'mitra_onboarding_type' => 'event',
        'email_verified_at' => now(),
    ]);

    $organizer = EventOrganizer::query()->create([
        'user_id' => $mitra->id,
        'name' => 'Organizer Saldo Test',
        'status' => 'verified',
    ]);

    return [$mitra, $organizer];
}

test('hotel purchase is included in hotel partner sales balance after successful payment', function () {
    $buyer = partnerBalanceBuyer();
    $mitra = partnerBalanceHotelMitra();

    DB::table('provinces')->insert(['code' => '35', 'name' => 'Jawa Timur']);
    DB::table('regencies')->insert([
        'code' => '3501',
        'province_code' => '35',
        'name' => 'Pacitan',
        'type' => 'Kabupaten',
    ]);

    $hotel = Hotel::query()->create([
        'vendor_id' => $mitra->id,
        'name' => 'Hotel Saldo Test',
        'city_id' => '3501',
        'address' => 'Jl. Saldo',
        'status' => 'published',
    ]);
    $roomType = RoomType::query()->create([
        'hotel_id' => $hotel->id,
        'name' => 'Deluxe',
        'base_price' => 240000,
        'total_rooms' => 5,
        'status' => 'published',
    ]);
    $booking = Booking::query()->create([
        'user_id' => $buyer->id,
        'hotel_id' => $hotel->id,
        'check_in' => now()->addDay()->toDateString(),
        'check_out' => now()->addDays(2)->toDateString(),
        'nights' => 1,
        'rooms_count' => 1,
        'guests_count' => 2,
        'subtotal' => 240000,
        'total' => 240000,
        'status' => 'pending_payment',
        'payment_status' => 'pending',
        'payment_deadline' => now()->addMinutes(15),
        'midtrans_order_id' => 'HOTEL-PARTNER-BALANCE-1',
    ]);
    BookingRoom::query()->create([
        'booking_id' => $booking->id,
        'room_type_id' => $roomType->id,
        'rooms_count' => 1,
        'price_per_night' => 240000,
        'subtotal' => 240000,
    ]);
    Payment::query()->create([
        'booking_id' => $booking->id,
        'provider' => 'midtrans',
        'status' => 'pending',
        'gross_amount' => 240000,
        'order_id' => 'HOTEL-PARTNER-BALANCE-1',
    ]);

    $this->withoutMiddleware()
        ->post('/payments/midtrans/callback', partnerBalanceMidtransPayload('HOTEL-PARTNER-BALANCE-1', 240000))
        ->assertOk();

    $booking->refresh();
    expect($booking->status)->toBe('paid')
        ->and($booking->total)->toBe(240000);

    $summaryUrl = '/mitra/finance/summary?date_from='
        .$booking->check_out->copy()->startOfMonth()->toDateString()
        .'&date_to='
        .$booking->check_out->copy()->endOfMonth()->toDateString();

    $this->actingAs($mitra)
        ->get($summaryUrl)
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('mitra/finance/summary')
            ->where('summary.total_bookings', 1)
            ->where('summary.gmv', fn ($value) => (int) $value === 240000)
            ->where('summary.commission_total', fn ($value) => (int) $value === 24000)
            ->where('summary.net_payout', fn ($value) => (int) $value === 216000)
        );
});

test('wisata ticket purchase is included in wisata partner sales balance after successful payment', function () {
    $buyer = partnerBalanceBuyer();
    [$mitra, $destination] = partnerBalanceWisataMitra();

    WisataCommissionRule::query()->create([
        'mitra_wisata_onboarding_id' => $destination->id,
        'type' => 'percentage',
        'value' => 10,
        'is_forever' => true,
    ]);
    $ticket = WisataTicket::query()->create([
        'mitra_wisata_onboarding_id' => $destination->id,
        'name' => 'Tiket Wisata',
        'price' => 75000,
        'quota' => 100,
        'is_active' => true,
    ]);
    $booking = WisataBooking::query()->create([
        'user_id' => $buyer->id,
        'mitra_wisata_onboarding_id' => $destination->id,
        'wisata_ticket_id' => $ticket->id,
        'booking_code' => 'WISATA-PARTNER-BALANCE-1',
        'visit_date' => now()->addDay()->toDateString(),
        'quantity' => 3,
        'unit_price' => 75000,
        'total_price' => 225000,
        'status' => 'pending_payment',
        'payment_status' => 'pending',
        'payment_deadline' => now()->addMinutes(15),
        'midtrans_order_id' => 'WISATA-PARTNER-BALANCE-1',
    ]);
    WisataPayment::query()->create([
        'wisata_booking_id' => $booking->id,
        'provider' => 'midtrans',
        'status' => 'pending',
        'gross_amount' => 225000,
        'order_id' => 'WISATA-PARTNER-BALANCE-1',
    ]);

    $this->withoutMiddleware()
        ->post('/payments/midtrans/callback', partnerBalanceMidtransPayload('WISATA-PARTNER-BALANCE-1', 225000))
        ->assertOk();

    $booking->refresh();
    expect($booking->status)->toBe('paid')
        ->and($booking->total_price)->toBe(225000);

    $this->actingAs($mitra)
        ->get('/mitra/wisata/finance/summary')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('mitra/wisata/finance/summary')
            ->where('summary.bookings_count', 1)
            ->where('summary.gross', fn ($value) => (int) $value === 225000)
            ->where('summary.commission', fn ($value) => (int) $value === 22500)
            ->where('summary.net', fn ($value) => (int) $value === 202500)
        );
});

test('event ticket purchase is included in event partner sales balance after successful payment', function () {
    $buyer = partnerBalanceBuyer();
    [$mitra, $organizer] = partnerBalanceEventMitra();

    $event = Event::query()->create([
        'event_organizer_id' => $organizer->id,
        'title' => 'Event Saldo Test',
        'status' => 'published',
        'published_at' => now(),
        'start_at' => now()->addWeek(),
        'capacity_total' => 100,
        'capacity_sold' => 0,
    ]);
    EventCommission::query()->create([
        'event_id' => $event->id,
        'type' => 'percentage',
        'value' => 10,
        'is_forever' => true,
    ]);
    $ticket = EventTicket::query()->create([
        'event_id' => $event->id,
        'name' => 'Regular',
        'price' => 150000,
        'quota' => 100,
        'sold_count' => 0,
        'is_active' => true,
    ]);
    $booking = EventBooking::query()->create([
        'user_id' => $buyer->id,
        'event_id' => $event->id,
        'event_ticket_id' => $ticket->id,
        'booking_code' => 'EVENT-PARTNER-BALANCE-1',
        'quantity' => 2,
        'total_price' => 300000,
        'status' => 'pending_payment',
        'payment_status' => 'pending',
        'payment_deadline' => now()->addMinutes(15),
        'midtrans_order_id' => 'EVENT-PARTNER-BALANCE-1',
    ]);
    EventPayment::query()->create([
        'event_booking_id' => $booking->id,
        'provider' => 'midtrans',
        'status' => 'pending',
        'gross_amount' => 300000,
        'order_id' => 'EVENT-PARTNER-BALANCE-1',
    ]);

    $this->withoutMiddleware()
        ->post('/payments/midtrans/callback', partnerBalanceMidtransPayload('EVENT-PARTNER-BALANCE-1', 300000))
        ->assertOk();

    $booking->refresh();
    $ticket->refresh();
    $event->refresh();

    expect($booking->status)->toBe('paid')
        ->and((int) $booking->total_price)->toBe(300000)
        ->and($ticket->sold_count)->toBe(2)
        ->and($event->capacity_sold)->toBe(2);

    $this->actingAs($mitra)
        ->get('/mitra/events/finance/summary')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('mitra/events/finance/summary')
            ->where('summary.bookings_count', 1)
            ->where('summary.gross', fn ($value) => (int) $value === 300000)
            ->where('summary.commission', fn ($value) => (int) $value === 30000)
            ->where('summary.net', fn ($value) => (int) $value === 270000)
        );
});
