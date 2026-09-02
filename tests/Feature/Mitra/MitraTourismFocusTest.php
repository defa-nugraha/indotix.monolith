<?php

use App\Models\ChatConversation;
use App\Models\MitraOnboarding;
use App\Models\MitraWisataOnboarding;
use App\Models\PartnerTermsDocument;
use App\Models\User;
use App\Models\WisataBooking;
use App\Models\WisataTicket;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

function tourismFocusMitra(string $email, ?string $type = 'wisata'): User
{
    return User::factory()->create([
        'role' => 'mitra',
        'email' => $email,
        'mitra_onboarding_type' => $type,
        'email_verified_at' => now(),
    ]);
}

function tourismFocusVerifiedDestination(string $email): array
{
    $user = tourismFocusMitra($email);

    $destination = MitraWisataOnboarding::query()->create([
        'user_id' => $user->id,
        'current_step' => 3,
        'destination_name' => 'Wisata '.$user->id,
        'destination_type' => 'alam',
        'verification_status' => 'verified',
        'payout_status' => 'verified',
        'is_suspended' => false,
    ]);

    return [$user, $destination];
}

function tourismFocusTicket(MitraWisataOnboarding $destination): WisataTicket
{
    return WisataTicket::query()->create([
        'mitra_wisata_onboarding_id' => $destination->id,
        'name' => 'Tiket Reguler',
        'price' => 50000,
        'quota' => 100,
        'ticket_type' => 'perorangan',
        'ticket_kind' => 'single',
        'is_active' => true,
    ]);
}

function tourismFocusBooking(User $customer, MitraWisataOnboarding $destination, WisataTicket $ticket): WisataBooking
{
    return WisataBooking::query()->create([
        'user_id' => $customer->id,
        'mitra_wisata_onboarding_id' => $destination->id,
        'wisata_ticket_id' => $ticket->id,
        'booking_code' => 'TFOCUS-'.$destination->id.'-'.$ticket->id,
        'visit_date' => now()->addDay()->toDateString(),
        'quantity' => 2,
        'unit_price' => 50000,
        'subtotal_price' => 100000,
        'total_price' => 100000,
        'status' => 'paid',
        'payment_status' => 'paid',
        'guest_name' => 'Customer Test',
        'guest_email' => $customer->email,
        'guest_phone' => '081234567890',
    ]);
}

it('lets mitra choose only wisata onboarding type', function () {
    $mitra = tourismFocusMitra('mitra-type-choice@indotix.test', null);

    $this->actingAs($mitra)
        ->post('/mitra/onboarding/type', ['type' => 'hotel'])
        ->assertSessionHasErrors('type');

    expect($mitra->refresh()->mitra_onboarding_type)->toBeNull();

    $this->actingAs($mitra)
        ->post('/mitra/onboarding/type', ['type' => 'wisata'])
        ->assertRedirect(route('mitra.wisata.onboarding'));

    expect($mitra->refresh()->mitra_onboarding_type)->toBe('wisata');
});

it('renders dashboard as wisata focused for legacy non wisata mitra', function () {
    $mitra = tourismFocusMitra('legacy-hotel-dashboard@indotix.test', 'hotel');

    $this->actingAs($mitra)
        ->get('/mitra/dashboard')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('mitra/dashboard')
            ->where('onboardingType', null)
            ->where('metrics', [])
            ->where('statusCards', []));
});

it('blocks non wisata direct routes for role mitra', function () {
    $hotelMitra = tourismFocusMitra('blocked-hotel-route@indotix.test', 'hotel');
    MitraOnboarding::query()->create([
        'user_id' => $hotelMitra->id,
        'current_step' => 3,
        'verification_status' => 'verified',
        'payout_status' => 'verified',
    ]);

    foreach ([
        '/mitra/onboarding',
        '/mitra/event/onboarding',
        '/mitra/hotels',
        '/mitra/bookings',
        '/mitra/events',
        '/mitra/events/tickets',
    ] as $url) {
        $this->actingAs($hotelMitra)
            ->get($url)
            ->assertNotFound();
    }

    $this->actingAs($hotelMitra)
        ->get('/mitra/wisata/onboarding')
            ->assertForbidden();

    $this->actingAs($hotelMitra)
        ->post('/mitra/onboarding/step-1', [])
        ->assertNotFound();

    $this->actingAs($hotelMitra)
        ->post('/mitra/event/onboarding/step-1', [])
        ->assertNotFound();
});

it('keeps wisata booking list and detail scoped to owned destination', function () {
    [$owner, $ownedDestination] = tourismFocusVerifiedDestination('booking-owner@indotix.test');
    [, $otherDestination] = tourismFocusVerifiedDestination('booking-other@indotix.test');
    $customer = User::factory()->create(['role' => 'user', 'email_verified_at' => now()]);

    $ownBooking = tourismFocusBooking($customer, $ownedDestination, tourismFocusTicket($ownedDestination));
    $otherBooking = tourismFocusBooking($customer, $otherDestination, tourismFocusTicket($otherDestination));

    $this->actingAs($owner)
        ->get('/mitra/wisata/bookings')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('bookings.data.0.id', $ownBooking->id)
            ->missing('bookings.data.1'));

    $this->actingAs($owner)
        ->get("/mitra/wisata/bookings/{$ownBooking->id}")
        ->assertOk();

    $this->actingAs($owner)
        ->get("/mitra/wisata/bookings/{$otherBooking->id}")
        ->assertForbidden();
});

it('hides and blocks non wisata mitra chat conversations', function () {
    [$mitra, $destination] = tourismFocusVerifiedDestination('chat-owner@indotix.test');
    $customer = User::factory()->create(['role' => 'user', 'email_verified_at' => now()]);

    $wisataConversation = ChatConversation::query()->create([
        'user_id' => $customer->id,
        'partner_id' => $mitra->id,
        'subject_type' => 'wisata',
        'subject_id' => $destination->id,
        'status' => 'open',
        'last_message_at' => now(),
    ]);

    $hotelConversation = ChatConversation::query()->create([
        'user_id' => $customer->id,
        'partner_id' => $mitra->id,
        'subject_type' => 'hotel',
        'subject_id' => 999,
        'status' => 'open',
        'last_message_at' => now()->addMinute(),
    ]);

    $this->actingAs($mitra)
        ->get('/mitra/chat')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('conversations.0.id', $wisataConversation->id)
            ->missing('conversations.1'));

    $this->actingAs($mitra)
        ->get("/mitra/chat/{$hotelConversation->id}")
        ->assertNotFound();
});

it('only allows verified wisata mitra to sign partner terms', function () {
    Storage::fake('public');

    $hotelMitra = tourismFocusMitra('hotel-terms-blocked@indotix.test', 'hotel');
    MitraOnboarding::query()->create([
        'user_id' => $hotelMitra->id,
        'current_step' => 3,
        'verification_status' => 'verified',
        'payout_status' => 'verified',
    ]);

    $path = UploadedFile::fake()
        ->create('terms.pdf', 128, 'application/pdf')
        ->store('partner-terms', 'public');

    PartnerTermsDocument::query()->create([
        'business_type' => 'hotel',
        'title' => 'S&K Mitra Hotel',
        'file_path' => $path,
    ]);

    $this->actingAs($hotelMitra)
        ->post('/mitra/terms/sign', ['accepted' => true])
        ->assertForbidden();
});
