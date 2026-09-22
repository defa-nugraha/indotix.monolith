<?php

use App\Models\SystemSetting;
use App\Models\User;
use App\Models\PublicPartner;
use App\Models\PublicPartOfLogo;
use App\Models\MitraWisataOnboarding;
use App\Models\Voucher;
use App\Models\WisataTicket;
use App\Support\HomePageContent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('admin can manage dynamic public home content', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);
    $voucher = Voucher::query()->create([
        'code' => 'HOMEPROMO12',
        'discount_type' => 'percentage',
        'discount_value' => 12,
        'min_transaction' => 0,
        'quota_total' => 10,
        'quota_used' => 2,
        'max_per_user_per_day' => 1,
        'is_active' => true,
    ]);

    $this->actingAs($admin)
        ->get('/admin/public/home')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/public/home/edit')
            ->where('content.values.special_promo_title', HomePageContent::DEFAULTS['special_promo_title'])
            ->where('content.values.featured_title', HomePageContent::DEFAULTS['featured_title'])
            ->where('content.icon_options.Gift', HomePageContent::ICON_OPTIONS['Gift'])
            ->where('content.icon_options.TreePalm', HomePageContent::ICON_OPTIONS['TreePalm'])
            ->where('content.image_upload_fields.special_promo_card_1_image_url', 'special_promo_card_1_image_url_file')
            ->where('content.video_upload_fields.special_promo_video_url', 'special_promo_video_url_file')
            ->has('partOfLogos', 0)
            ->where('voucherOptions.0.code', 'HOMEPROMO12')
            ->where('voucherOptions.0.remaining_quota', 8));

    $payload = HomePageContent::DEFAULTS;
    $payload['category_1_label'] = 'Keluarga';
    $payload['category_1_icon'] = 'Sparkles';
    $payload['special_promo_title'] = 'Promo spesial akhir pekan';
    $payload['special_promo_video_url'] = '/storage/promo-videos/weekend.mp4';
    $payload['special_promo_video_poster_url'] = '/storage/promo-videos/weekend.jpg';
    $payload['special_promo_card_1_title'] = 'Wisata keluarga';
    $payload['special_promo_card_1_image_url'] = '/storage/promo/family.jpg';
    $payload['special_promo_card_1_link_url'] = "/promo/voucher/{$voucher->code}";
    $payload['featured_link_label'] = 'Jelajah semua wisata';

    $this->actingAs($admin)
        ->put('/admin/public/home', $payload)
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect(SystemSetting::query()->where('key', 'home_category_1_label')->value('value'))->toBe('Keluarga')
        ->and(SystemSetting::query()->where('key', 'home_category_1_icon')->value('value'))->toBe('Sparkles')
        ->and(SystemSetting::query()->where('key', 'home_special_promo_title')->value('value'))->toBe('Promo spesial akhir pekan')
        ->and(SystemSetting::query()->where('key', 'home_special_promo_video_url')->value('value'))->toBe('/storage/promo-videos/weekend.mp4')
        ->and(SystemSetting::query()->where('key', 'home_special_promo_card_1_image_url')->value('value'))->toBe('/storage/promo/family.jpg')
        ->and(SystemSetting::query()->where('key', 'home_featured_link_label')->value('value'))->toBe('Jelajah semua wisata');

    PublicPartner::query()->create([
        'name' => 'Partner Aktif',
        'image_path' => 'public-partners/partner-aktif.png',
        'link_url' => 'https://partner.example.test',
        'sort_order' => 1,
        'is_active' => true,
    ]);
    PublicPartner::query()->create([
        'name' => 'Partner Nonaktif',
        'image_path' => 'public-partners/partner-nonaktif.png',
        'sort_order' => 2,
        'is_active' => false,
    ]);
    PublicPartOfLogo::query()->create([
        'name' => 'Logo Part of Aktif',
        'image_path' => 'public-part-of-logos/part-of-aktif.png',
        'sort_order' => 1,
        'is_active' => true,
    ]);
    PublicPartOfLogo::query()->create([
        'name' => 'Logo Part of Nonaktif',
        'image_path' => 'public-part-of-logos/part-of-nonaktif.png',
        'sort_order' => 2,
        'is_active' => false,
    ]);

    $this->get('/')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('welcome')
            ->where('homeContent.categories.0.label', 'Keluarga')
            ->where('homeContent.categories.0.icon', 'Sparkles')
            ->where('homeContent.special_promo.title', 'Promo spesial akhir pekan')
            ->where('homeContent.special_promo.video.url', '/storage/promo-videos/weekend.mp4')
            ->where('homeContent.special_promo.cards.0.title', 'Wisata keluarga')
            ->where('homeContent.special_promo.cards.0.image_url', '/storage/promo/family.jpg')
            ->where('homeContent.special_promo.cards.0.voucher_code', 'HOMEPROMO12')
            ->where('homeContent.special_promo.cards.0.voucher_remaining_count', 8)
            ->where('homeContent.featured.link_label', 'Jelajah semua wisata')
            ->where('homeContent.part_of.logos.0.name', 'Logo Part of Aktif')
            ->where('homeContent.part_of.logos.0.image_url', '/storage/public-part-of-logos/part-of-aktif.png')
            ->missing('homeContent.part_of.logos.1')
            ->where('partners.0.name', 'Partner Aktif')
            ->where('partners.0.image_url', '/storage/public-partners/partner-aktif.png')
            ->missing('partners.1'));

});

test('admin can manage public home part of logos from home content tab', function () {
    Storage::fake('public');

    $admin = User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);

    $this->actingAs($admin)
        ->post('/admin/public/home/part-of-logos', [
            'name' => 'El John Media',
            'sort_order' => 4,
            'is_active' => true,
            'image' => fakeTestImage('eljohn-media.png'),
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $logo = PublicPartOfLogo::query()->firstOrFail();

    expect($logo->name)->toBe('El John Media')
        ->and($logo->sort_order)->toBe(4)
        ->and($logo->is_active)->toBeTrue()
        ->and($logo->image_path)->toStartWith('public-part-of-logos/');

    Storage::disk('public')->assertExists($logo->image_path);

    $this->actingAs($admin)
        ->get('/admin/public/home')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('partOfLogos.0.name', 'El John Media')
            ->where('partOfLogos.0.sort_order', 4)
            ->where('partOfLogos.0.is_active', true));

    $oldPath = $logo->image_path;

    $this->actingAs($admin)
        ->put("/admin/public/home/part-of-logos/{$logo->id}", [
            'name' => 'El John Group',
            'sort_order' => 1,
            'is_active' => false,
            'image' => fakeTestImage('eljohn-group.png'),
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $logo->refresh();

    expect($logo->name)->toBe('El John Group')
        ->and($logo->sort_order)->toBe(1)
        ->and($logo->is_active)->toBeFalse()
        ->and($logo->image_path)->not->toBe($oldPath);

    Storage::disk('public')->assertMissing($oldPath);
    Storage::disk('public')->assertExists($logo->image_path);

    $newPath = $logo->image_path;

    $this->actingAs($admin)
        ->delete("/admin/public/home/part-of-logos/{$logo->id}")
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect(PublicPartOfLogo::query()->whereKey($logo->id)->exists())->toBeFalse();
    Storage::disk('public')->assertMissing($newPath);
});

test('admin can upload public home special promo media from file input', function () {
    Storage::fake('public');

    $admin = User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);

    $payload = HomePageContent::DEFAULTS;
    $payload['_method'] = 'put';
    $payload['special_promo_video_url_file'] = UploadedFile::fake()->create('promo-wisata.mp4', 1024, 'video/mp4');
    $payload['special_promo_card_1_image_url_file'] = fakeTestImage('promo-keluarga.png');
    $payload['special_promo_video_poster_url_file'] = fakeTestImage('poster-video.png');

    $this->actingAs($admin)
        ->post('/admin/public/home', $payload)
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $videoUrl = SystemSetting::query()
        ->where('key', 'home_special_promo_video_url')
        ->value('value');
    $cardUrl = SystemSetting::query()
        ->where('key', 'home_special_promo_card_1_image_url')
        ->value('value');
    $posterUrl = SystemSetting::query()
        ->where('key', 'home_special_promo_video_poster_url')
        ->value('value');

    expect($videoUrl)->toStartWith('/storage/home-content/')
        ->and($cardUrl)->toStartWith('/storage/home-content/')
        ->and($posterUrl)->toStartWith('/storage/home-content/');

    Storage::disk('public')->assertExists(Str::after($videoUrl, '/storage/'));
    Storage::disk('public')->assertExists(Str::after($cardUrl, '/storage/'));
    Storage::disk('public')->assertExists(Str::after($posterUrl, '/storage/'));
});

test('admin cannot upload non image file for public home special promo image', function () {
    Storage::fake('public');

    $admin = User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);

    $payload = HomePageContent::DEFAULTS;
    $payload['_method'] = 'put';
    $payload['special_promo_card_1_image_url_file'] = UploadedFile::fake()->create('promo.pdf', 32, 'application/pdf');

    $this->actingAs($admin)
        ->post('/admin/public/home', $payload)
        ->assertSessionHasErrors('special_promo_card_1_image_url_file');
});

test('admin cannot upload non video file for public home special promo video', function () {
    Storage::fake('public');

    $admin = User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);

    $payload = HomePageContent::DEFAULTS;
    $payload['_method'] = 'put';
    $payload['special_promo_video_url_file'] = UploadedFile::fake()->create('promo.pdf', 32, 'application/pdf');

    $this->actingAs($admin)
        ->post('/admin/public/home', $payload)
        ->assertSessionHasErrors('special_promo_video_url_file');
});

test('public home exposes wisata products grouped by available category', function () {
    $mitra = User::factory()->create([
        'role' => 'mitra',
        'email_verified_at' => now(),
    ]);

    $alam = MitraWisataOnboarding::query()->create([
        'user_id' => $mitra->id,
        'current_step' => 3,
        'destination_name' => 'Wisata Alam Indotix',
        'destination_type' => 'alam',
        'verification_status' => 'verified',
        'payout_status' => 'verified',
        'is_live' => true,
        'is_suspended' => false,
        'is_temporarily_closed' => false,
    ]);
    $budaya = MitraWisataOnboarding::query()->create([
        'user_id' => $mitra->id,
        'current_step' => 3,
        'destination_name' => 'Wisata Budaya Indotix',
        'destination_type' => 'budaya',
        'verification_status' => 'verified',
        'payout_status' => 'verified',
        'is_live' => true,
        'is_suspended' => false,
        'is_temporarily_closed' => false,
    ]);
    MitraWisataOnboarding::query()->create([
        'user_id' => $mitra->id,
        'current_step' => 3,
        'destination_name' => 'Wisata Draft Indotix',
        'destination_type' => 'edukasi',
        'verification_status' => 'verified',
        'payout_status' => 'verified',
        'is_live' => false,
        'is_suspended' => false,
        'is_temporarily_closed' => false,
    ]);

    foreach ([$alam, $budaya] as $destination) {
        WisataTicket::query()->create([
            'mitra_wisata_onboarding_id' => $destination->id,
            'name' => 'Tiket Masuk',
            'price' => 100000,
            'quota' => 20,
            'daily_quota' => 20,
            'is_active' => true,
            'is_closed' => false,
        ]);
    }

    $this->get('/')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('welcome')
            ->has('categorySections', 2)
            ->where('categorySections.0.key', 'alam')
            ->where('categorySections.0.title', 'Wisata Alam')
            ->where('categorySections.0.products.0.name', 'Wisata Alam Indotix')
            ->where('categorySections.1.key', 'budaya')
            ->where('categorySections.1.title', 'Wisata Budaya')
            ->where('categorySections.1.products.0.name', 'Wisata Budaya Indotix'));
});
