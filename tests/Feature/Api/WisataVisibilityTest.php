<?php

use App\Models\MitraWisataOnboarding;
use App\Models\User;
use App\Models\WisataBooking;
use App\Models\WisataTicket;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;

uses(RefreshDatabase::class);

beforeEach(function () {
    config([
        'api_cache.enabled' => true,
        'api_cache.store' => 'array',
    ]);

    Cache::store('array')->flush();
});

function createWisataVisibilityDestination(bool $isLive, string $name): MitraWisataOnboarding
{
    $destination = MitraWisataOnboarding::query()->create([
        'user_id' => User::factory()->create(['role' => 'mitra'])->id,
        'current_step' => 3,
        'destination_name' => $name,
        'destination_type' => 'alam',
        'verification_status' => 'verified',
        'payout_status' => 'verified',
        'is_live' => $isLive,
        'is_suspended' => false,
        'is_temporarily_closed' => false,
    ]);

    WisataTicket::query()->create([
        'mitra_wisata_onboarding_id' => $destination->id,
        'name' => 'Tiket '.$name,
        'price' => 50000,
        'quota' => 100,
        'daily_quota' => 100,
        'is_active' => true,
        'is_closed' => false,
    ]);

    return $destination;
}

test('wisata API only returns destinations with live status', function () {
    $live = createWisataVisibilityDestination(true, 'Wisata Live Test');
    $draft = createWisataVisibilityDestination(false, 'Wisata Draft Test');

    $this->getJson('/api/products/wisata?q=Wisata')
        ->assertOk()
        ->assertJsonFragment(['destination_name' => $live->destination_name])
        ->assertJsonMissing(['destination_name' => $draft->destination_name]);

    $this->getJson('/api/discovery/wisata?q=Wisata')
        ->assertOk()
        ->assertJsonFragment(['title' => $live->destination_name])
        ->assertJsonMissing(['title' => $draft->destination_name]);

    $this->getJson('/api/products/wisata/'.$draft->slug)
        ->assertNotFound();
});

test('wisata booking quote rejects draft destination even with valid ids', function () {
    $user = User::factory()->create([
        'role' => 'user',
        'email_verified_at' => now(),
        'phone' => '081234567890',
    ]);
    $draft = createWisataVisibilityDestination(false, 'Wisata Draft Booking Test');
    $ticket = $draft->tickets()->firstOrFail();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/wisata/bookings/quote', [
            'destination_id' => Crypt::encryptString((string) $draft->id),
            'ticket_id' => Crypt::encryptString((string) $ticket->id),
            'visit_date' => now()->addDay()->toDateString(),
            'quantity' => 1,
        ])
        ->assertStatus(422)
        ->assertJsonPath('message', 'Destinasi tidak tersedia.');
});

test('wisata booking quote returns a price and subtotal for every selected ticket', function () {
    $user = User::factory()->create([
        'role' => 'user',
        'email_verified_at' => now(),
        'phone' => '081234567890',
    ]);
    $destination = createWisataVisibilityDestination(true, 'Wisata Harga Per Tiket');
    $entryTicket = $destination->tickets()->firstOrFail();
    $entryTicket->update(['price' => 50000, 'is_entry_ticket' => true]);
    $continuationTicket = WisataTicket::query()->create([
        'mitra_wisata_onboarding_id' => $destination->id,
        'name' => 'Tiket Wahana',
        'price' => 25000,
        'quota' => 100,
        'daily_quota' => 100,
        'is_entry_ticket' => false,
        'is_active' => true,
        'is_closed' => false,
    ]);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/wisata/bookings/quote', [
            'destination_id' => Crypt::encryptString((string) $destination->id),
            'visit_date' => now()->addDay()->toDateString(),
            'items' => [
                ['ticket_id' => Crypt::encryptString((string) $entryTicket->id), 'quantity' => 1],
                ['ticket_id' => Crypt::encryptString((string) $continuationTicket->id), 'quantity' => 2],
            ],
        ])
        ->assertOk()
        ->assertJsonPath('pricing.total', 100000)
        ->assertJsonPath('pricing.items.0.unit_price', 50000)
        ->assertJsonPath('pricing.items.0.subtotal', 50000)
        ->assertJsonPath('pricing.items.1.unit_price', 25000)
        ->assertJsonPath('pricing.items.1.subtotal', 50000);
});

test('wisata booking quote counts pending bookings against ticket quota', function () {
    $user = User::factory()->create([
        'role' => 'user',
        'email_verified_at' => now(),
        'phone' => '081234567890',
    ]);
    $destination = createWisataVisibilityDestination(true, 'Wisata Kuota Test');
    $ticket = $destination->tickets()->firstOrFail();
    $ticket->update([
        'quota' => 5,
        'daily_quota' => 5,
    ]);
    $visitDate = now()->addDay()->toDateString();

    WisataBooking::query()->create([
        'user_id' => User::factory()->create()->id,
        'mitra_wisata_onboarding_id' => $destination->id,
        'wisata_ticket_id' => $ticket->id,
        'booking_code' => 'WISATA-QUOTA-PENDING',
        'visit_date' => $visitDate,
        'quantity' => 4,
        'unit_price' => $ticket->price,
        'total_price' => $ticket->price * 4,
        'status' => 'pending_payment',
        'payment_status' => 'pending',
        'payment_deadline' => now()->addMinutes(15),
    ]);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/wisata/bookings/quote', [
            'destination_id' => Crypt::encryptString((string) $destination->id),
            'ticket_id' => Crypt::encryptString((string) $ticket->id),
            'visit_date' => $visitDate,
            'quantity' => 2,
        ])
        ->assertStatus(422)
        ->assertJsonPath('message', 'Kuota tiket tidak mencukupi.');

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/wisata/bookings/quote', [
            'destination_id' => Crypt::encryptString((string) $destination->id),
            'ticket_id' => Crypt::encryptString((string) $ticket->id),
            'visit_date' => $visitDate,
            'quantity' => 1,
        ])
        ->assertOk()
        ->assertJsonPath('pricing.quantity', 1);
});

test('wisata booking quote respects ticket minimum and maximum order limits', function () {
    $user = User::factory()->create([
        'role' => 'user',
        'email_verified_at' => now(),
        'phone' => '081234567890',
    ]);
    $destination = createWisataVisibilityDestination(true, 'Wisata Limit Order Test');
    $ticket = $destination->tickets()->firstOrFail();
    $ticket->update([
        'min_order_quantity' => 2,
        'max_order_quantity' => 4,
    ]);
    $payload = [
        'destination_id' => Crypt::encryptString((string) $destination->id),
        'ticket_id' => Crypt::encryptString((string) $ticket->id),
        'visit_date' => now()->addDay()->toDateString(),
    ];

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/wisata/bookings/quote', $payload + ['quantity' => 1])
        ->assertStatus(422)
        ->assertJsonPath('message', 'Minimal pembelian '.$ticket->name.' 2 tiket.');

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/wisata/bookings/quote', $payload + ['quantity' => 5])
        ->assertStatus(422)
        ->assertJsonPath('message', 'Maksimal pembelian '.$ticket->name.' 4 tiket.');

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/wisata/bookings/quote', $payload + ['quantity' => 2])
        ->assertOk()
        ->assertJsonPath('pricing.quantity', 2);
});

test('wisata booking quote rejects continuation ticket without entry ticket', function () {
    $user = User::factory()->create([
        'role' => 'user',
        'email_verified_at' => now(),
        'phone' => '081234567890',
    ]);
    $destination = createWisataVisibilityDestination(true, 'Wisata Terusan Test');
    $ticket = $destination->tickets()->firstOrFail();
    $ticket->update(['is_entry_ticket' => false]);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/wisata/bookings/quote', [
            'destination_id' => Crypt::encryptString((string) $destination->id),
            'ticket_id' => Crypt::encryptString((string) $ticket->id),
            'visit_date' => now()->addDay()->toDateString(),
            'quantity' => 1,
        ])
        ->assertStatus(422)
        ->assertJsonPath('message', 'Tiket terusan hanya dapat dipesan bersama tiket masuk.');
});

test('wisata mobile API accepts continuation ticket when entry ticket is included', function () {
    $user = User::factory()->create([
        'role' => 'user',
        'email_verified_at' => now(),
        'phone' => '081234567890',
    ]);
    $destination = createWisataVisibilityDestination(true, 'Wisata Mobile Multi Ticket Test');
    $entryTicket = $destination->tickets()->firstOrFail();
    $entryTicket->update(['price' => 50000, 'is_entry_ticket' => true]);
    $continuationTicket = WisataTicket::query()->create([
        'mitra_wisata_onboarding_id' => $destination->id,
        'name' => 'Tiket Wahana',
        'price' => 25000,
        'quota' => 100,
        'daily_quota' => 100,
        'is_entry_ticket' => false,
        'is_active' => true,
        'is_closed' => false,
    ]);
    $visitDate = now()->addDay()->toDateString();
    $items = [
        [
            'ticket_id' => Crypt::encryptString((string) $entryTicket->id),
            'quantity' => 1,
        ],
        [
            'ticket_id' => Crypt::encryptString((string) $continuationTicket->id),
            'quantity' => 2,
        ],
    ];

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/wisata/bookings/quote', [
            'destination_id' => Crypt::encryptString((string) $destination->id),
            'ticket_id' => Crypt::encryptString((string) $entryTicket->id),
            'visit_date' => $visitDate,
            'quantity' => 3,
            'items' => $items,
        ])
        ->assertOk()
        ->assertJsonPath('pricing.quantity', 3)
        ->assertJsonPath('pricing.total', 100000)
        ->assertJsonPath('pricing.items.0.is_entry_ticket', true)
        ->assertJsonPath('pricing.items.1.is_entry_ticket', false);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/wisata/bookings', [
            'destination_id' => Crypt::encryptString((string) $destination->id),
            'ticket_id' => Crypt::encryptString((string) $entryTicket->id),
            'visit_date' => $visitDate,
            'quantity' => 3,
            'items' => $items,
            'guest_name' => 'User Mobile',
            'guest_email' => 'mobile@example.test',
        ])
        ->assertCreated()
        ->assertJsonPath('booking.quantity', 3)
        ->assertJsonPath('booking.total', 100000)
        ->assertJsonPath('booking.items.0.quantity', 1)
        ->assertJsonPath('booking.items.1.quantity', 2);
});

test('wisata product cache is invalidated when booking availability changes', function () {
    $destination = createWisataVisibilityDestination(true, 'Wisata Cache Kuota Test');
    $ticket = $destination->tickets()->firstOrFail();
    $ticket->update([
        'quota' => 5,
        'daily_quota' => 5,
    ]);
    $visitDate = now()->addDay()->toDateString();

    $this->getJson('/api/products/wisata?visit_date='.$visitDate.'&quantity=2')
        ->assertOk()
        ->assertHeader('X-Cache', 'MISS')
        ->assertJsonPath('destinations.0.tickets.0.available', 5);

    $this->getJson('/api/products/wisata?visit_date='.$visitDate.'&quantity=2')
        ->assertOk()
        ->assertHeader('X-Cache', 'HIT');

    WisataBooking::query()->create([
        'user_id' => User::factory()->create()->id,
        'mitra_wisata_onboarding_id' => $destination->id,
        'wisata_ticket_id' => $ticket->id,
        'booking_code' => 'WISATA-CACHE-INVALIDATION',
        'visit_date' => $visitDate,
        'quantity' => 4,
        'unit_price' => $ticket->price,
        'total_price' => $ticket->price * 4,
        'status' => 'pending_payment',
        'payment_status' => 'pending',
        'payment_deadline' => now()->addMinutes(15),
    ]);

    $this->getJson('/api/products/wisata?visit_date='.$visitDate.'&quantity=2')
        ->assertOk()
        ->assertHeader('X-Cache', 'MISS')
        ->assertJsonCount(0, 'destinations');
});
