<?php

use App\Models\PublicPartOfLogo;
use App\Models\User;
use App\Support\HomePageContent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('admin creates edits and removes a part of link exposed to home', function () {
    Storage::fake('public');
    $admin = User::factory()->create(['role' => 'admin']);
    $this->actingAs($admin)->post('/admin/public/home/part-of-logos', [
        'name' => 'Group', 'image' => fakeTestImage(), 'link_url' => 'https://example.com/group',
    ])->assertSessionHasNoErrors();
    $logo = PublicPartOfLogo::firstOrFail();
    expect($logo->link_url)->toBe('https://example.com/group');
    expect(HomePageContent::publicPartOfLogos()[0]['link_url'])->toBe($logo->link_url);
    $this->get('/admin/public/home')->assertInertia(fn (Assert $page) => $page->where('partOfLogos.0.link_url', $logo->link_url));

    $this->post("/admin/public/home/part-of-logos/{$logo->id}", [
        '_method' => 'put', 'name' => 'Updated', 'link_url' => 'https://example.com/new',
    ])->assertSessionHasNoErrors();
    expect($logo->fresh()->link_url)->toBe('https://example.com/new');
    $this->put("/admin/public/home/part-of-logos/{$logo->id}", ['name' => 'Legacy request'])->assertSessionHasNoErrors();
    expect($logo->fresh()->link_url)->toBe('https://example.com/new');
    $this->put("/admin/public/home/part-of-logos/{$logo->id}", ['link_url' => ''])->assertSessionHasNoErrors();
    expect($logo->fresh()->link_url)->toBeNull();
});

test('invalid part of links cannot mutate records or replace images', function ($url) {
    Storage::fake('public');
    Storage::disk('public')->put('old.png', 'original');
    $logo = PublicPartOfLogo::create(['name' => 'Original', 'image_path' => 'old.png', 'link_url' => 'https://example.com']);
    $this->actingAs(User::factory()->create(['role' => 'admin']))
        ->put("/admin/public/home/part-of-logos/{$logo->id}", [
            'name' => 'Changed', 'link_url' => $url, 'image' => fakeTestImage(),
        ])->assertSessionHasErrors('link_url');
    expect($logo->fresh()->name)->toBe('Original');
    expect($logo->fresh()->link_url)->toBe('https://example.com');
    expect(Storage::disk('public')->get('old.png'))->toBe('original');
})->with(['javascript:alert(1)', 'data:text/html,test', 'ftp://example.com', 'invalid', 'https://example.com/'.str_repeat('a', 2048)]);

test('non admin cannot change part of links', function () {
    $logo = PublicPartOfLogo::create(['image_path' => 'old.png']);
    $this->actingAs(User::factory()->create(['role' => 'user']))
        ->put("/admin/public/home/part-of-logos/{$logo->id}", ['link_url' => 'https://example.com'])
        ->assertRedirect(route('dashboard'));
    expect($logo->fresh()->link_url)->toBeNull();
});
