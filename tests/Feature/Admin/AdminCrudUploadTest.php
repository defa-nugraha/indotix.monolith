<?php

use App\Models\PublicBanner;
use App\Models\PromoItem;
use App\Models\SouvenirCategory;
use App\Models\SouvenirProduct;
use App\Models\User;
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
            'image' => UploadedFile::fake()->image('banner.jpg', 1200, 450),
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
            'image' => UploadedFile::fake()->image('banner-updated.jpg', 1200, 450),
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
    $oldPath = UploadedFile::fake()->image('existing.jpg', 1200, 450)
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
            'image' => UploadedFile::fake()->image('invalid-size.jpg', 800, 600),
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
            'image' => UploadedFile::fake()->image('banner-1.jpg', 1200, 450),
        ])
        ->assertRedirect('/admin/public/banners')
        ->assertSessionHasNoErrors();

    $firstBanner = PublicBanner::query()->firstOrFail();

    $this->actingAs($admin)
        ->post('/admin/public/banners', [
            'title' => 'Banner Kedua',
            'sort_order' => 2,
            'is_active' => true,
            'image' => UploadedFile::fake()->image('banner-2.jpg', 1200, 450),
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
            'image' => UploadedFile::fake()->image('promo-conflict.jpg', 600, 800),
        ])
        ->assertSessionHasErrors('sort_order');

    $this->actingAs($admin)
        ->post('/admin/public/promo-items', [
            'title' => 'Promo Slot Dua',
            'slug' => 'promo-slot-dua',
            'category' => 'wisata',
            'sort_order' => 2,
            'is_active' => true,
            'image' => UploadedFile::fake()->image('promo-slot-dua.jpg', 600, 800),
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

test('retail product crud stores and removes image files', function () {
    Storage::fake('public');
    $admin = superAdminForUploadTest();
    $category = SouvenirCategory::query()->create([
        'name' => 'Kategori Test',
        'is_active' => true,
    ]);

    $this->actingAs($admin)
        ->post('/admin/retail-shop/products', [
            'name' => 'Produk Test',
            'category_id' => $category->id,
            'description' => 'Deskripsi produk',
            'price' => 150000,
            'cost_price' => 100000,
            'sku' => 'SKU-TEST-1',
            'weight' => 500,
            'length' => 10,
            'width' => 10,
            'height' => 10,
            'status' => 'active',
            'min_stock' => 1,
            'stock' => 5,
            'images' => [
                UploadedFile::fake()->image('produk.jpg', 800, 600),
            ],
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $product = SouvenirProduct::query()->where('sku', 'SKU-TEST-1')->firstOrFail();
    $image = $product->images()->firstOrFail();

    Storage::disk('public')->assertExists($image->image_url);

    $this->actingAs($admin)
        ->put("/admin/retail-shop/products/{$product->id}", [
            'name' => 'Produk Test Update',
            'category_id' => $category->id,
            'description' => 'Deskripsi update',
            'price' => 175000,
            'cost_price' => 100000,
            'sku' => 'SKU-TEST-1',
            'weight' => 600,
            'length' => 12,
            'width' => 11,
            'height' => 10,
            'status' => 'active',
            'min_stock' => 1,
            'stock' => 8,
            'images' => [
                UploadedFile::fake()->image('produk-2.jpg', 800, 600),
            ],
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $product->refresh();
    expect($product->name)->toBe('Produk Test Update')
        ->and($product->images()->count())->toBe(2);

    $imagePath = $image->image_url;
    $this->actingAs($admin)
        ->delete("/admin/retail-shop/products/{$product->id}/images/{$image->id}")
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($product->images()->whereKey($image->id)->exists())->toBeFalse();
    Storage::disk('public')->assertMissing($imagePath);

    $this->actingAs($admin)
        ->delete("/admin/retail-shop/products/{$product->id}/force")
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect(SouvenirProduct::query()->whereKey($product->id)->exists())->toBeFalse();
});
