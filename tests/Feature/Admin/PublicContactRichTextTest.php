<?php

use App\Models\PublicContact;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('admin saves formatted address and public home receives safe html', function () {
    $admin = User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);
    $this->actingAs($admin)->put('/admin/public/contacts', [
        'address' => '<p><strong>Kantor &amp; Layanan</strong></p><p>Jakarta<br>Indonesia</p><script>alert(1)</script><a href="javascript:alert(1)" onclick="alert(1)">Lokasi</a>',
    ])->assertSessionHasNoErrors()->assertRedirect();

    $contact = PublicContact::firstOrFail();
    expect($contact->address)->toContain('<strong>Kantor &amp; Layanan</strong>', '<br>')
        ->not->toContain('<script', 'javascript:', 'onclick');
    $this->get('/')->assertInertia(fn (Assert $page) => $page
        ->where('contact.address_html', $contact->address_html));
});

test('invalid contact update preserves previous rich address', function () {
    $admin = User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);
    $contact = PublicContact::create(['address' => '<p><strong>Alamat lama</strong></p>']);
    $this->actingAs($admin)->put('/admin/public/contacts', [
        'address' => '<p>Alamat baru</p>', 'email' => 'invalid-email',
    ])->assertSessionHasErrors('email');
    expect($contact->fresh()->address)->toBe('<p><strong>Alamat lama</strong></p>');
});

test('invalid first update does not create a contact', function () {
    $admin = User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);
    $this->actingAs($admin)->put('/admin/public/contacts', ['address' => str_repeat('a', 1001)])
        ->assertSessionHasErrors('address');
    expect(PublicContact::count())->toBe(0);
});

test('non admin cannot update public contact', function () {
    $user = User::factory()->create(['role' => 'user', 'email_verified_at' => now()]);
    $this->actingAs($user)->put('/admin/public/contacts', ['address' => '<p>Changed</p>'])->assertRedirect(route('dashboard'));
    expect(PublicContact::count())->toBe(0);
});
