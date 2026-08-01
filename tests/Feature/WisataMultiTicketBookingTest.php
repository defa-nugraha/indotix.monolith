<?php

use App\Models\MitraWisataOnboarding;
use App\Models\User;
use App\Models\WisataBooking;
use App\Models\WisataTicket;
use App\Models\Voucher;
use App\Services\MidtransService;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
        'is_active' => true,
        'is_closed' => false,
    ]);

    $children = WisataTicket::query()->create([
        'mitra_wisata_onboarding_id' => $destination->id,
        'name' => 'Tiket Anak-anak',
        'price' => 50000,
        'quota' => 25,
        'daily_quota' => 25,
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
        ->and((int) $booking->wisata_ticket_id)->toBe((int) $regular->id);

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
        );

    $this->getJson("/api/products/wisata/{$destination->slug}?visit_date={$visitDate}")
        ->assertOk()
        ->assertJsonPath('tickets.0.available', 23)
        ->assertJsonPath('tickets.1.available', 21);
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
            ->where('pendingVoucherCode', 'WISATAHEMAT10')
            ->where('pricing.subtotal', 400000)
            ->where('pricing.discount_amount', 0)
            ->where('pricing.total', 400000)
        );

    $this->actingAs($user)
        ->from('/wisata/booking/review')
        ->post('/wisata/booking/voucher', [
            'voucher_code' => 'wisatahemat10',
        ])
        ->assertRedirect('/wisata/booking/review');

    $this->actingAs($user)
        ->get('/wisata/booking/review')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('voucher.code', 'WISATAHEMAT10')
            ->where('pricing.subtotal', 400000)
            ->where('pricing.discount_amount', 40000)
            ->where('pricing.total', 360000)
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
