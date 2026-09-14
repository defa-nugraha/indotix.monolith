<?php

use App\Models\PublicBanner;
use App\Models\PublicPartner;
use App\Models\PromoItem;
use App\Models\User;
use App\Support\HomePageContent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

function superAdminForUploadTest(): User
{
    return User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);
}

test('public banner crud stores replaces and deletes image file', function () {
    Storage::fake('public');
    $admin = superAdminForUploadTest();

    $this->actingAs($admin)
        ->post('/admin/public/banners', [
            'title' => 'Banner Test',
            'sort_order' => 1,
            'is_active' => true,
            'image' => fakeTestImage('banner.png'),
        ])
        ->assertRedirect('/admin/public/banners')
        ->assertSessionHasNoErrors();

    $banner = PublicBanner::query()->firstOrFail();
    $firstPath = $banner->image_path;

    Storage::disk('public')->assertExists($firstPath);

    $this->actingAs($admin)
        ->post("/admin/public/banners/{$banner->id}", [
            '_method' => 'put',
            'title' => 'Banner Updated',
            'sort_order' => 2,
            'is_active' => false,
            'image' => fakeTestImage('banner-updated.png'),
        ])
        ->assertRedirect('/admin/public/banners')
        ->assertSessionHasNoErrors();

    $banner->refresh();
    expect($banner->title)->toBe('Banner Updated')
        ->and($banner->image_path)->not->toBe($firstPath);

    Storage::disk('public')->assertMissing($firstPath);
    Storage::disk('public')->assertExists($banner->image_path);

    $lastPath = $banner->image_path;
    $this->actingAs($admin)
        ->delete("/admin/public/banners/{$banner->id}")
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect(PublicBanner::query()->whereKey($banner->id)->exists())->toBeFalse();
    Storage::disk('public')->assertMissing($lastPath);
});

test('invalid banner replacement keeps the current image', function () {
    Storage::fake('public');
    $admin = superAdminForUploadTest();
    $oldPath = fakeTestImage('existing.png')
        ->store('public-banners', 'public');
    $banner = PublicBanner::query()->create([
        'title' => 'Banner Existing',
        'sort_order' => 1,
        'is_active' => true,
        'image_path' => $oldPath,
    ]);

    $this->actingAs($admin)
        ->post("/admin/public/banners/{$banner->id}", [
            '_method' => 'put',
            'title' => 'Tidak boleh tersimpan',
            'sort_order' => 2,
            'is_active' => true,
            'image' => UploadedFile::fake()->create('invalid.txt', 1, 'text/plain'),
        ])
        ->assertSessionHasErrors('image');

    expect($banner->fresh()->title)->toBe('Banner Existing')
        ->and($banner->fresh()->image_path)->toBe($oldPath);
    Storage::disk('public')->assertExists($oldPath);
});

test('multiple public banners can be active for homepage carousel', function () {
    Storage::fake('public');
    $admin = superAdminForUploadTest();

    $this->actingAs($admin)
        ->post('/admin/public/banners', [
            'title' => 'Banner Pertama',
            'sort_order' => 1,
            'is_active' => true,
            'image' => fakeTestImage('banner-1.png'),
        ])
        ->assertRedirect('/admin/public/banners')
        ->assertSessionHasNoErrors();

    $firstBanner = PublicBanner::query()->firstOrFail();

    $this->actingAs($admin)
        ->post('/admin/public/banners', [
            'title' => 'Banner Kedua',
            'sort_order' => 2,
            'is_active' => true,
            'image' => fakeTestImage('banner-2.png'),
        ])
        ->assertRedirect('/admin/public/banners')
        ->assertSessionHasNoErrors();

    $secondBanner = PublicBanner::query()->where('title', 'Banner Kedua')->firstOrFail();

    expect(PublicBanner::query()->where('is_active', true)->count())->toBe(2)
        ->and($firstBanner->fresh()->is_active)->toBeTrue()
        ->and($secondBanner->fresh()->is_active)->toBeTrue();

    $this->actingAs($admin)
        ->post("/admin/public/banners/{$firstBanner->id}", [
            '_method' => 'put',
            'title' => 'Banner Pertama Aktif',
            'sort_order' => 1,
            'is_active' => true,
        ])
        ->assertRedirect('/admin/public/banners')
        ->assertSessionHasNoErrors();

    expect(PublicBanner::query()->where('is_active', true)->count())->toBe(2)
        ->and($firstBanner->fresh()->is_active)->toBeTrue()
        ->and($secondBanner->fresh()->is_active)->toBeTrue();
});

test('public partner image is required and blank image paths are not exposed', function () {
    Storage::fake('public');
    $admin = superAdminForUploadTest();

    $this->actingAs($admin)
        ->post('/admin/public/partners', [
            'name' => 'Partner Tanpa Logo',
            'sort_order' => 1,
            'is_active' => true,
        ])
        ->assertSessionHasErrors('image');

    expect(PublicPartner::query()->exists())->toBeFalse();

    PublicPartner::query()->create([
        'name' => 'Data Lama Tanpa Logo',
        'image_path' => '',
        'sort_order' => 1,
        'is_active' => true,
    ]);

    expect(HomePageContent::publicPartners())->toBeEmpty();
});

test('promo homepage slots cannot be reused', function () {
    Storage::fake('public');
    $admin = superAdminForUploadTest();

    PromoItem::query()->create([
        'title' => 'Promo Slot Satu',
        'slug' => 'promo-slot-satu',
        'category' => 'wisata',
        'excerpt' => 'Promo aktif',
        'description' => 'Promo untuk homepage.',
        'terms' => 'Syarat berlaku.',
        'image_path' => 'promo-items/existing.jpg',
        'sort_order' => 1,
        'is_active' => true,
    ]);

    $this->actingAs($admin)
        ->post('/admin/public/promo-items', [
            'title' => 'Promo Bentrok',
            'slug' => 'promo-bentrok',
            'category' => 'wisata',
            'sort_order' => 1,
            'is_active' => true,
            'image' => fakeTestImage('promo-conflict.png', 600, 800),
        ])
        ->assertSessionHasErrors('sort_order');

    $this->actingAs($admin)
        ->post('/admin/public/promo-items', [
            'title' => 'Promo Slot Dua',
            'slug' => 'promo-slot-dua',
            'category' => 'wisata',
            'sort_order' => 2,
            'is_active' => true,
            'image' => fakeTestImage('promo-slot-dua.png', 600, 800),
        ])
        ->assertRedirect('/admin/public/promo-items')
        ->assertSessionHasNoErrors();

    $secondPromo = PromoItem::query()->where('slug', 'promo-slot-dua')->firstOrFail();

    $this->actingAs($admin)
        ->post("/admin/public/promo-items/{$secondPromo->id}", [
            '_method' => 'put',
            'title' => 'Promo Slot Dua',
            'slug' => 'promo-slot-dua',
            'category' => 'wisata',
            'sort_order' => 1,
            'is_active' => true,
        ])
        ->assertSessionHasErrors('sort_order');
});

test('retired retail product upload routes are unavailable', function () {
    $admin = superAdminForUploadTest();

    $this->actingAs($admin)
        ->post('/admin/retail-shop/products', [
            'name' => 'Produk Test',
        ])
        ->assertNotFound();
});
