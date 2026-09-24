<?php

use App\Models\PublicContactItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('admin can manage contact us items and public page only shows active items', function () {
    $admin = User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);

    $this->actingAs($admin)->post('/admin/public/contact-us', [
        'name' => 'WhatsApp Indotix',
        'contact' => '081292059888',
        'description' => 'Bantuan pemesanan tiket wisata.',
        'icon' => 'MessageCircle',
        'sort_order' => 2,
        'is_active' => true,
    ])->assertRedirect();

    $contact = PublicContactItem::firstOrFail();
    expect($contact->icon)->toBe('MessageCircle');

    $this->actingAs($admin)->put("/admin/public/contact-us/{$contact->id}", [
        'name' => 'Customer Service Wisata',
        'contact' => 'cs@indotix.co.id',
        'description' => 'Layanan bantuan wisata.',
        'icon' => 'Headphones',
        'sort_order' => 1,
        'is_active' => false,
    ])->assertRedirect();

    $this->withoutVite()->get('/contact-us')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('contacts', []));

    $this->actingAs($admin)->delete("/admin/public/contact-us/{$contact->id}")
        ->assertRedirect();

    expect(PublicContactItem::count())->toBe(0);
});

test('non admin cannot manage contact us items', function () {
    $user = User::factory()->create(['role' => 'user', 'email_verified_at' => now()]);

    $this->actingAs($user)->post('/admin/public/contact-us', [
        'name' => 'Kontak',
        'contact' => '0812',
        'icon' => 'Phone',
    ])->assertRedirect(route('dashboard'));

    expect(PublicContactItem::count())->toBe(0);
});
