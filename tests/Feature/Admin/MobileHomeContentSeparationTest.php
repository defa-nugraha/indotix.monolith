<?php

use App\Models\MobileHomeHero;
use App\Models\MobilePromoBanner;
use App\Models\PublicBanner;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

function mobileAdmin(): User
{
    return User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);
}

test('mobile hero and promo use independent records and storage', function () {
    Storage::fake('public');
    $admin = mobileAdmin();

    $heroPayload = fn (string $title, string $type, UploadedFile $media, int $sort, array $extra = []) => [
        'title' => $title,
        'highlight_title' => 'Indonesia',
        'media_type' => $type,
        'media' => $media,
        'sort_order' => $sort,
        'is_active' => true,
        ...$extra,
    ];

    $this->actingAs($admin)->post('/admin/mobile/home/heroes', $heroPayload(
        'Image Mobile', 'image', UploadedFile::fake()->create('mobile-hero.png', 20, 'image/png'), 2,
    ))->assertRedirect();
    $this->actingAs($admin)->post('/admin/mobile/home/heroes', $heroPayload(
        'GIF Mobile', 'gif', UploadedFile::fake()->create('mobile-hero.gif', 20, 'image/gif'), 1,
    ))->assertRedirect();
    $this->actingAs($admin)->post('/admin/mobile/home/heroes', $heroPayload(
        'Video Mobile', 'video', UploadedFile::fake()->create('mobile-hero.mp4', 20, 'video/mp4'), 3,
        ['poster' => UploadedFile::fake()->create('mobile-poster.png', 20, 'image/png')],
    ))->assertRedirect();

    $heroes = MobileHomeHero::query()->orderBy('sort_order')->get();
    expect($heroes)->toHaveCount(3);
    expect($heroes->pluck('media_type')->all())->toBe(['gif', 'image', 'video']);
    expect($heroes->every(fn (MobileHomeHero $hero) => str_starts_with($hero->media_path, 'mobile/home/heroes/')))->toBeTrue();
    $heroes->each(fn (MobileHomeHero $hero) => Storage::disk('public')->assertExists($hero->media_path));

    $this->actingAs($admin)->post('/admin/mobile/promos', [
        'name' => 'Promo Mobile',
        'alt_text' => 'Promo khusus aplikasi mobile',
        'sort_order' => 1,
        'image' => UploadedFile::fake()->create('mobile-promo.png', 20, 'image/png'),
        'is_active' => true,
    ])->assertRedirect();

    $promo = MobilePromoBanner::query()->firstOrFail();
    expect($promo->image_path)->toStartWith('mobile/home/promos/');
    Storage::disk('public')->assertExists($promo->image_path);

    $this->getJson('/api/mobile/home')
        ->assertOk()
        ->assertJsonCount(3, 'mobile_home.heroes')
        ->assertJsonPath('mobile_home.heroes.0.title', 'GIF Mobile')
        ->assertJsonPath('mobile_home.heroes.2.media_type', 'video')
        ->assertJsonPath('mobile_home.promos.0.name', 'Promo Mobile');

    expect(PublicBanner::query()->count())->toBe(0);
    $this->getJson('/api/banners')->assertJsonPath('banners', []);
});

test('website banners never appear in mobile home api', function () {
    Storage::fake('public');
    $admin = mobileAdmin();

    $this->actingAs($admin)->post('/admin/public/banners', [
        'title' => 'Website Only',
        'image' => UploadedFile::fake()->create('website.png', 20, 'image/png'),
        'is_active' => true,
    ])->assertRedirect();

    $this->getJson('/api/banners')->assertJsonPath('banners.0.title', 'Website Only');
    $this->getJson('/api/mobile/home')
        ->assertOk()
        ->assertJsonMissing(['name' => 'Website Only'])
        ->assertJsonMissing(['title' => 'Website Only']);
});

test('mobile hero headline is optional when creating a hero', function () {
    Storage::fake('public');
    $admin = mobileAdmin();

    $this->actingAs($admin)->post('/admin/mobile/home/heroes', [
        'title' => '',
        'media_type' => 'image',
        'media' => UploadedFile::fake()->create('mobile-hero-no-headline.png', 20, 'image/png'),
        'is_active' => true,
    ])->assertRedirect();

    expect(MobileHomeHero::query()->latest('id')->value('title'))->toBeNull();
});

test('mobile routes require existing admin authorization', function () {
    $this->get('/admin/mobile/home')->assertRedirect();
    $this->get('/admin/mobile/promos')->assertRedirect();
});
