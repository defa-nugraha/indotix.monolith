<?php

use App\Models\MitraWisataOnboarding;
use App\Models\User;
use App\Models\WisataBooking;
use App\Models\WisataTicket;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('admin dashboard summarizes wisata bookings and tickets', function () {
    $admin = User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);
    $customer = User::factory()->create(['role' => 'user']);
    $destinationOwner = User::factory()->create(['role' => 'mitra']);
    $destination = MitraWisataOnboarding::query()->create([
        'user_id' => $destinationOwner->id,
        'destination_name' => 'Wisata Dashboard',
        'verification_status' => 'verified',
        'payout_status' => 'verified',
        'is_live' => true,
    ]);
    $ticket = WisataTicket::query()->create([
        'mitra_wisata_onboarding_id' => $destination->id,
        'name' => 'Tiket Dashboard',
        'price' => 100000,
        'quota' => 20,
        'is_active' => true,
    ]);
    WisataBooking::query()->create([
        'user_id' => $customer->id,
        'mitra_wisata_onboarding_id' => $destination->id,
        'wisata_ticket_id' => $ticket->id,
        'booking_code' => 'WISATA-DASHBOARD-1',
        'visit_date' => now()->toDateString(),
        'quantity' => 2,
        'unit_price' => 100000,
        'total_price' => 200000,
        'status' => 'paid',
    ]);

    $this->actingAs($admin)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('scope', 'admin')
            ->where('summary.transactions_today', 1)
            ->where('summary.tickets_sold', 2)
            ->where('system.pending_payments', 0));
});
