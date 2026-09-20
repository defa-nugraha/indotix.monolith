<?php

use App\Mail\WisataTicketMail;
use App\Models\MitraWisataOnboarding;
use App\Models\SystemSetting;
use App\Models\User;
use App\Models\WisataBooking;
use App\Models\WisataPayment;
use App\Models\WisataTicket;
use App\Models\Voucher;
use App\Services\MidtransService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

function createWisataMultiTicketFixture(): array
{
    $destination = MitraWisataOnboarding::query()->create([
        'user_id' => User::factory()->create(['role' => 'mitra'])->id,
        'current_step' => 3,
        'destination_name' => 'Wisata Demo Indotix',
        'destination_type' => 'alam',
        'verification_status' => 'verified',
        'payout_status' => 'verified',
        'is_live' => true,
        'is_suspended' => false,
        'is_temporarily_closed' => false,
    ]);

    $regular = WisataTicket::query()->create([
        'mitra_wisata_onboarding_id' => $destination->id,
        'name' => 'Tiket Reguler',
        'price' => 100000,
        'quota' => 25,
        'daily_quota' => 25,
        'is_entry_ticket' => true,
        'is_active' => true,
        'is_closed' => false,
    ]);

    $children = WisataTicket::query()->create([
        'mitra_wisata_onboarding_id' => $destination->id,
        'name' => 'Tiket Anak-anak',
        'price' => 50000,
        'quota' => 25,
        'daily_quota' => 25,
        'is_entry_ticket' => false,
        'is_active' => true,
        'is_closed' => false,
    ]);

    return [$destination, $regular, $children];
}

test('user can book multiple wisata ticket types in one order', function () {
    [$destination, $regular, $children] = createWisataMultiTicketFixture();
    $visitDate = now()->addDays(2)->toDateString();
    $user = User::factory()->create([
        'role' => 'user',
        'email_verified_at' => now(),
        'phone' => '081234567890',
    ]);
    SystemSetting::query()->create([
        'key' => 'wisata_booking_timeout_minutes',
        'value' => '25',
        'type' => 'number',
    ]);

    $this->actingAs($user)
        ->post('/wisata/booking/prepare', [
            'destination_id' => $destination->id,
            'ticket_id' => $regular->id,
            'visit_date' => $visitDate,
            'quantity' => 6,
            'items' => [
                ['ticket_id' => $regular->id, 'quantity' => 2],
                ['ticket_id' => $children->id, 'quantity' => 4],
            ],
        ])
        ->assertRedirect('/wisata/booking/review');

    $this->actingAs($user)
        ->get('/wisata/booking/review')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('public/wisata/booking/review')
            ->where('pricing.quantity', 6)
            ->where('pricing.total', 400000)
            ->where('items.0.ticket_id', $regular->id)
            ->where('items.0.quantity', 2)
            ->where('items.0.subtotal', 200000)
            ->where('items.1.ticket_id', $children->id)
            ->where('items.1.quantity', 4)
            ->where('items.1.subtotal', 200000)
        );

    $this->mock(MidtransService::class, function ($mock) use ($regular, $children) {
        $mock
            ->shouldReceive('snap')
            ->once()
            ->with(\Mockery::on(function (array $payload) use ($regular, $children) {
                return $payload['transaction_details']['gross_amount'] === 400000
                    && collect($payload['item_details'])->contains(fn (array $item) => $item['id'] === (string) $regular->id && $item['quantity'] === 2 && $item['price'] === 100000)
                    && collect($payload['item_details'])->contains(fn (array $item) => $item['id'] === (string) $children->id && $item['quantity'] === 4 && $item['price'] === 50000);
            }))
            ->andReturn([
                'token' => 'snap-token-test',
                'redirect_url' => 'https://payments.test/wisata',
                'transaction_id' => 'trx-wisata-test',
            ]);
    });

    $this->actingAs($user)
        ->postJson('/wisata/booking/confirm', [
            'guest_name' => 'User Indotix',
            'guest_email' => 'user@example.test',
        ])
        ->assertOk()
        ->assertJsonPath('snap_token', 'snap-token-test');

    $booking = WisataBooking::query()->firstOrFail();

    expect($booking->quantity)->toBe(6)
        ->and((int) $booking->total_price)->toBe(400000)
        ->and((int) $booking->wisata_ticket_id)->toBe((int) $regular->id)
        ->and($booking->payment_deadline->between(now()->addMinutes(24), now()->addMinutes(26)))->toBeTrue();

    $this->assertDatabaseHas('wisata_booking_items', [
        'wisata_booking_id' => $booking->id,
        'wisata_ticket_id' => $regular->id,
        'ticket_name' => 'Tiket Reguler',
        'quantity' => 2,
        'unit_price' => 100000,
        'subtotal' => 200000,
    ]);

    $this->assertDatabaseHas('wisata_booking_items', [
        'wisata_booking_id' => $booking->id,
        'wisata_ticket_id' => $children->id,
        'ticket_name' => 'Tiket Anak-anak',
        'quantity' => 4,
        'unit_price' => 50000,
        'subtotal' => 200000,
    ]);

    $this->get("/wisata/{$destination->slug}?visit_date={$visitDate}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('tickets.0.available', 23)
            ->where('tickets.1.available', 21)
            ->where('tickets.0.is_entry_ticket', true)
            ->where('tickets.1.is_entry_ticket', false)
        );

    $this->getJson("/api/products/wisata/{$destination->slug}?visit_date={$visitDate}")
        ->assertOk()
        ->assertJsonPath('tickets.0.available', 23)
        ->assertJsonPath('tickets.1.available', 21)
        ->assertJsonPath('tickets.0.is_entry_ticket', true)
        ->assertJsonPath('tickets.1.is_entry_ticket', false);
});

test('a different wisata order requires acknowledgment but never reuses an unpaid order', function () {
    [$destination, $ticket] = createWisataMultiTicketFixture();
    $user = User::factory()->create([
        'role' => 'user',
        'email_verified_at' => now(),
        'phone' => '081234567890',
    ]);
    $visitDate = now()->addDays(2)->toDateString();

    $this->mock(MidtransService::class, function ($mock) {
        $mock->shouldReceive('snap')->twice()->andReturn(
            ['token' => 'first-token', 'redirect_url' => 'https://payments.test/first'],
            ['token' => 'second-token', 'redirect_url' => 'https://payments.test/second'],
        );
    });

    $prepare = fn (int $quantity) => $this->actingAs($user)
        ->post('/wisata/booking/prepare', [
            'destination_id' => $destination->id,
            'ticket_id' => $ticket->id,
            'visit_date' => $visitDate,
            'quantity' => $quantity,
        ])->assertRedirect('/wisata/booking/review');

    $prepare(1);
    $this->postJson('/wisata/booking/confirm', [
        'guest_name' => $user->name,
        'guest_email' => $user->email,
    ])->assertOk()->assertJsonPath('snap_token', 'first-token');

    $first = WisataBooking::query()->sole();
    $prepare(2);
    $this->get('/wisata/booking/review')
        ->assertInertia(fn (Assert $page) => $page
            ->component('public/wisata/booking/review')
            ->where('hasUnpaidBooking', true)
            ->where('pricing.quantity', 2));

    $this->postJson('/wisata/booking/confirm', [
        'guest_name' => $user->name,
        'guest_email' => $user->email,
    ])->assertUnprocessable()->assertJsonValidationErrors('booking');
    expect(WisataBooking::query()->count())->toBe(1);

    $this->postJson('/wisata/booking/confirm', [
        'guest_name' => $user->name,
        'guest_email' => $user->email,
        'confirm_new_booking' => true,
    ])->assertOk()->assertJsonPath('snap_token', 'second-token');

    expect(WisataBooking::query()->count())->toBe(2);
    $second = WisataBooking::query()->where('id', '!=', $first->id)->sole();
    expect($first->fresh()->status)->toBe('pending_payment')
        ->and($second->quantity)->toBe(2)
        ->and($second->booking_code)->not->toBe($first->booking_code);
});

test('guest booking draft survives login and continues to wisata review', function () {
    [$destination, $regular] = createWisataMultiTicketFixture();
    $visitDate = now()->addDays(2)->toDateString();
    $user = User::factory()->create([
        'role' => 'user',
        'email_verified_at' => now(),
        'phone' => '081234567890',
    ]);

    $this->post('/wisata/booking/prepare', [
        'destination_id' => $destination->id,
        'ticket_id' => $regular->id,
        'visit_date' => $visitDate,
        'quantity' => 1,
    ])
        ->assertRedirect(route('login', absolute: false))
        ->assertSessionHas('wisata_booking_draft.destination_id', $destination->id)
        ->assertSessionHas('wisata_booking_draft.ticket_id', $regular->id);

    $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
    ])->assertRedirect(route('wisata.booking.review', absolute: false));

    $this->assertAuthenticatedAs($user);
});

test('user must include an entry ticket when booking continuation ticket', function () {
    [$destination, $regular, $children] = createWisataMultiTicketFixture();
    $visitDate = now()->addDays(2)->toDateString();
    $user = User::factory()->create([
        'role' => 'user',
        'email_verified_at' => now(),
        'phone' => '081234567890',
    ]);

    $this->actingAs($user)
        ->from("/wisata/{$destination->slug}")
        ->post('/wisata/booking/prepare', [
            'destination_id' => $destination->id,
            'ticket_id' => $children->id,
            'visit_date' => $visitDate,
            'quantity' => 1,
            'items' => [
                ['ticket_id' => $children->id, 'quantity' => 1],
            ],
        ])
        ->assertRedirect("/wisata/{$destination->slug}")
        ->assertSessionHasErrors([
            'items' => 'Tiket terusan hanya dapat dipesan bersama tiket masuk.',
        ]);

    $this->actingAs($user)
        ->post('/wisata/booking/prepare', [
            'destination_id' => $destination->id,
            'ticket_id' => $regular->id,
            'visit_date' => $visitDate,
            'items' => [
                ['ticket_id' => $regular->id, 'quantity' => 1],
                ['ticket_id' => $children->id, 'quantity' => 1],
            ],
        ])
        ->assertRedirect('/wisata/booking/review');
});

test('selected promo voucher prefills and discounts wisata booking', function () {
    [$destination, $regular, $children] = createWisataMultiTicketFixture();
    $visitDate = now()->addDays(3)->toDateString();
    $voucher = Voucher::query()->create([
        'code' => 'WISATAHEMAT10',
        'discount_type' => 'percentage',
        'discount_value' => 10,
        'min_transaction' => 100000,
        'quota_total' => 5,
        'quota_used' => 0,
        'is_active' => true,
    ]);
    $user = User::factory()->create([
        'role' => 'user',
        'email_verified_at' => now(),
        'phone' => '081234567890',
    ]);

    $this->get("/promo/voucher/{$voucher->code}")
        ->assertRedirect('/wisata');

    $this->actingAs($user)
        ->post('/wisata/booking/prepare', [
            'destination_id' => $destination->id,
            'ticket_id' => $regular->id,
            'visit_date' => $visitDate,
            'items' => [
                ['ticket_id' => $regular->id, 'quantity' => 2],
                ['ticket_id' => $children->id, 'quantity' => 4],
            ],
        ])
        ->assertRedirect('/wisata/booking/review');

    $this->actingAs($user)
        ->get('/wisata/booking/review')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('public/wisata/booking/review')
            ->where('voucher.code', 'WISATAHEMAT10')
            ->where('pricing.subtotal', 400000)
            ->where('pricing.discount_amount', 40000)
            ->where('pricing.total', 360000)
            ->where('pendingVoucherCode', null)
        );

    $this->mock(MidtransService::class, function ($mock) {
        $mock
            ->shouldReceive('snap')
            ->once()
            ->with(\Mockery::on(function (array $payload) {
                return $payload['transaction_details']['gross_amount'] === 360000
                    && collect($payload['item_details'])->contains(fn (array $item) => str_starts_with((string) $item['id'], 'VOUCHER-') && $item['price'] === -40000);
            }))
            ->andReturn([
                'token' => 'snap-token-voucher',
                'redirect_url' => 'https://payments.test/wisata-voucher',
                'transaction_id' => 'trx-wisata-voucher',
            ]);
    });

    $this->actingAs($user)
        ->postJson('/wisata/booking/confirm', [
            'guest_name' => 'User Indotix',
            'guest_email' => 'user@example.test',
        ])
        ->assertOk()
        ->assertJsonPath('snap_token', 'snap-token-voucher');

    $booking = WisataBooking::query()->firstOrFail();

    expect((int) $booking->subtotal_price)->toBe(400000)
        ->and($booking->voucher_code)->toBe('WISATAHEMAT10')
        ->and((int) $booking->discount_amount)->toBe(40000)
        ->and((int) $booking->total_price)->toBe(360000);

    expect((int) $voucher->fresh()->quota_used)->toBe(1);
});

test('fully discounted wisata booking is paid without calling midtrans', function () {
    Mail::fake();
    [$destination, $regular] = createWisataMultiTicketFixture();
    $visitDate = now()->addDays(3)->toDateString();
    $voucher = Voucher::query()->create([
        'code' => 'GRATIS100',
        'discount_type' => 'percentage',
        'discount_value' => 100,
        'quota_total' => 5,
        'quota_used' => 0,
        'is_active' => true,
    ]);
    $user = User::factory()->create([
        'role' => 'user',
        'email_verified_at' => now(),
        'phone' => '081234567890',
    ]);

    $this->actingAs($user)
        ->post('/wisata/booking/prepare', [
            'destination_id' => $destination->id,
            'ticket_id' => $regular->id,
            'visit_date' => $visitDate,
            'items' => [
                ['ticket_id' => $regular->id, 'quantity' => 1],
            ],
        ])
        ->assertRedirect('/wisata/booking/review');

    $this->actingAs($user)
        ->post('/wisata/booking/voucher', ['voucher_code' => $voucher->code])
        ->assertSessionHasNoErrors();

    $this->mock(MidtransService::class, function ($mock) {
        $mock->shouldReceive('snap')->never();
    });

    $response = $this->actingAs($user)
        ->postJson('/wisata/booking/confirm', [
            'guest_name' => 'User Gratis',
            'guest_email' => 'gratis@example.test',
        ])
        ->assertOk()
        ->assertJsonPath('snap_token', null)
        ->assertJsonPath('payment_status', 'paid');

    $booking = WisataBooking::query()->firstOrFail();

    expect((int) $booking->subtotal_price)->toBe(100000)
        ->and($booking->voucher_code)->toBe('GRATIS100')
        ->and((int) $booking->discount_amount)->toBe(100000)
        ->and((int) $booking->total_price)->toBe(0)
        ->and($booking->status)->toBe('paid')
        ->and($booking->payment_status)->toBe('paid');

    expect((int) $voucher->fresh()->quota_used)->toBe(1)
        ->and(WisataPayment::query()->where('wisata_booking_id', $booking->id)->value('provider'))->toBe('internal')
        ->and(WisataPayment::query()->where('wisata_booking_id', $booking->id)->value('payment_type'))->toBe('free_voucher')
        ->and((int) WisataPayment::query()->where('wisata_booking_id', $booking->id)->value('gross_amount'))->toBe(0);

    expect(str_starts_with((string) $response->json('redirect_url'), '/wisata/booking/'))->toBeTrue();

    Mail::assertSent(WisataTicketMail::class, 1);
});

test('targeted promo voucher redirects to selected destination and is blocked on other destinations', function () {
    [$destination, $regular] = createWisataMultiTicketFixture();
    [$otherDestination, $otherRegular] = createWisataMultiTicketFixture();
    $otherDestination->forceFill(['destination_name' => 'Wisata Lain'])->save();
    $visitDate = now()->addDays(3)->toDateString();
    $voucher = Voucher::query()->create([
        'code' => 'TARGETDEST',
        'discount_type' => 'percentage',
        'discount_value' => 10,
        'quota_total' => 5,
        'quota_used' => 0,
        'is_active' => true,
    ]);
    $voucher->wisataDestinations()->sync([$destination->id]);
    $user = User::factory()->create([
        'role' => 'user',
        'email_verified_at' => now(),
        'phone' => '081234567890',
    ]);

    $this->get("/promo/voucher/{$voucher->code}")
        ->assertRedirect(route('wisata.show', [
            'destination' => $destination->slug,
            'promo' => $voucher->code,
        ], false));

    $this->actingAs($user)
        ->post('/wisata/booking/prepare', [
            'destination_id' => $otherDestination->id,
            'ticket_id' => $otherRegular->id,
            'visit_date' => $visitDate,
            'items' => [
                ['ticket_id' => $otherRegular->id, 'quantity' => 1],
            ],
        ])
        ->assertRedirect('/wisata/booking/review');

    $this->actingAs($user)
        ->post('/wisata/booking/voucher', ['voucher_code' => $voucher->code])
        ->assertSessionHasErrors('voucher_code');

    $this->actingAs($user)
        ->post('/wisata/booking/prepare', [
            'destination_id' => $destination->id,
            'ticket_id' => $regular->id,
            'visit_date' => $visitDate,
            'items' => [
                ['ticket_id' => $regular->id, 'quantity' => 1],
            ],
        ])
        ->assertRedirect('/wisata/booking/review');

    $this->actingAs($user)
        ->get('/wisata/booking/review')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('voucher.code', 'TARGETDEST'));
});
