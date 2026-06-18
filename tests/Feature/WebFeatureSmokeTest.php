<?php

use App\Models\MitraEventOnboarding;
use App\Models\MitraOnboarding;
use App\Models\MitraWisataOnboarding;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function smokeUser(string $role, array $attributes = []): User
{
    return User::factory()->create(array_merge([
        'role' => $role,
        'email_verified_at' => now(),
    ], $attributes));
}

function verifiedHotelMitra(): User
{
    $user = smokeUser('mitra', ['mitra_onboarding_type' => 'hotel']);

    MitraOnboarding::query()->create([
        'user_id' => $user->id,
        'current_step' => 3,
        'verification_status' => 'verified',
        'payout_status' => 'verified',
    ]);

    return $user;
}

function verifiedWisataMitra(): User
{
    $user = smokeUser('mitra', ['mitra_onboarding_type' => 'wisata']);

    MitraWisataOnboarding::query()->create([
        'user_id' => $user->id,
        'current_step' => 3,
        'verification_status' => 'verified',
        'payout_status' => 'verified',
    ]);

    return $user;
}

function verifiedEventMitra(): User
{
    $user = smokeUser('mitra', ['mitra_onboarding_type' => 'event']);

    MitraEventOnboarding::query()->create([
        'user_id' => $user->id,
        'current_step' => 4,
        'verification_status' => 'verified',
    ]);

    return $user;
}

it('renders core public web pages', function (string $url) {
    $this->get($url)->assertOk();
})->with([
    'home' => '/',
    'login' => '/login',
    'register' => '/register',
    'stay search' => '/stay',
]);

it('renders representative admin feature pages for a super admin', function (string $url) {
    $admin = smokeUser('admin');

    $this->actingAs($admin)
        ->get($url)
        ->assertOk();
})->with([
    'dashboard' => '/dashboard',
    'users' => '/admin/users',
    'mitra hotel' => '/admin/mitra',
    'mitra wisata' => '/admin/mitra-wisata',
    'hotel management' => '/hotels',
    'hotel create' => '/hotels/create',
    'bookings' => '/admin/bookings',
    'payouts' => '/admin/finance/payouts',
    'commission rules' => '/admin/finance/commissions',
    'events' => '/admin/events',
    'event organizers' => '/admin/events/organizers',
    'event tickets' => '/admin/events/tickets',
    'event bookings' => '/admin/events/bookings',
    'wisata destinations' => '/admin/wisata/destinations',
    'wisata tickets' => '/admin/wisata/tickets',
    'wisata bookings' => '/admin/wisata/bookings',
    'academy classes' => '/admin/academy/classes',
    'academy tickets' => '/admin/academy/tickets',
    'retail products' => '/admin/retail-shop/products',
    'retail orders' => '/admin/retail-shop/orders',
    'public banners' => '/admin/public/banners',
    'blog posts' => '/admin/blog/posts',
    'reviews' => '/admin/reviews',
    'system roles' => '/admin/system/roles',
    'system settings' => '/admin/system/settings',
]);

it('renders representative hotel partner pages for a verified mitra', function (string $url) {
    $mitra = verifiedHotelMitra();

    $this->actingAs($mitra)
        ->get($url)
        ->assertOk();
})->with([
    'dashboard' => '/mitra/dashboard',
    'hotels' => '/mitra/hotels',
    'hotel create' => '/mitra/hotels/create',
    'room types' => '/mitra/room-types',
    'room inventories' => '/mitra/room-inventories',
    'bookings' => '/mitra/bookings',
    'finance summary' => '/mitra/finance/summary',
    'payouts' => '/mitra/finance/payouts',
    'bank account' => '/mitra/finance/bank',
    'reviews' => '/mitra/reviews',
]);

it('renders representative wisata partner pages for a verified mitra', function (string $url) {
    $mitra = verifiedWisataMitra();

    $this->actingAs($mitra)
        ->get($url)
        ->assertOk();
})->with([
    'dashboard' => '/mitra/dashboard',
    'destination profile' => '/mitra/wisata/destination',
    'tickets' => '/mitra/wisata/tickets',
    'bookings' => '/mitra/wisata/bookings',
    'finance summary' => '/mitra/wisata/finance/summary',
    'payouts' => '/mitra/wisata/finance/payouts',
    'notifications' => '/mitra/wisata/notifications',
]);

it('renders representative event partner pages for a verified mitra', function (string $url) {
    $mitra = verifiedEventMitra();

    $this->actingAs($mitra)
        ->get($url)
        ->assertOk();
})->with([
    'dashboard' => '/mitra/dashboard',
    'events' => '/mitra/events',
    'event create' => '/mitra/events/create',
    'tickets' => '/mitra/events/tickets',
    'bookings' => '/mitra/events/bookings',
    'attendees' => '/mitra/events/attendees',
    'finance summary' => '/mitra/events/finance/summary',
    'payouts' => '/mitra/events/finance/payouts',
    'notifications' => '/mitra/events/notifications',
]);
