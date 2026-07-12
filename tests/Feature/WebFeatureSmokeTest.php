<?php

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

it('renders core public web pages', function (string $url) {
    $this->get($url)->assertOk();
})->with([
    'home' => '/',
    'login' => '/login',
    'register' => '/register',
    'wisata search' => '/wisata',
]);

it('renders representative admin feature pages for a super admin', function (string $url) {
    $admin = smokeUser('admin');

    $this->actingAs($admin)
        ->get($url)
        ->assertOk();
})->with([
    'dashboard' => '/dashboard',
    'users' => '/admin/users',
    'mitra wisata' => '/admin/mitra-wisata',
    'mitra documents' => '/admin/mitra-documents',
    'wisata destinations' => '/admin/wisata/destinations',
    'wisata tickets' => '/admin/wisata/tickets',
    'wisata bookings' => '/admin/wisata/bookings',
    'public banners' => '/admin/public/banners',
    'blog posts' => '/admin/blog/posts',
    'reviews' => '/admin/reviews',
    'system roles' => '/admin/system/roles',
    'system settings' => '/admin/system/settings',
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
