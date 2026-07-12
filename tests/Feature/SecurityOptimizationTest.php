<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('public responses include baseline security headers', function () {
    $this->get('/')
        ->assertOk()
        ->assertHeader('X-Content-Type-Options', 'nosniff')
        ->assertHeader('X-Frame-Options', 'SAMEORIGIN')
        ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
        ->assertHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
});

test('non admin user cannot access admin api endpoints', function () {
    $user = User::factory()->create([
        'role' => 'user',
        'email_verified_at' => now(),
    ]);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/admin/notifications', [
            'title' => 'Tidak boleh terkirim',
            'message' => 'Percobaan user biasa.',
            'type' => 'system',
        ])
        ->assertForbidden()
        ->assertJsonPath('message', 'Forbidden.');
});

test('public sitemap is valid xml and cacheable', function () {
    $this->get('/sitemap.xml')
        ->assertOk()
        ->assertHeader('Content-Type', 'application/xml; charset=UTF-8')
        ->assertHeader('Cache-Control', 'max-age=3600, public')
        ->assertSee('<?xml version="1.0" encoding="UTF-8"?>', false)
        ->assertSee(url('/wisata'), false)
        ->assertDontSee(url('/events'), false);
});
