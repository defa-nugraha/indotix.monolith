<?php

use App\Models\SystemSetting;
use App\Models\User;
use App\Models\PublicPartner;
use App\Models\MitraWisataOnboarding;
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
            ->where('content.video_upload_fields.special_promo_video_url', 'special_promo_video_url_file'));

    $payload = HomePageContent::DEFAULTS;
    $payload['category_1_label'] = 'Keluarga';
    $payload['category_1_icon'] = 'Sparkles';
    $payload['special_promo_title'] = 'Promo spesial akhir pekan';
    $payload['special_promo_video_url'] = '/storage/promo-videos/weekend.mp4';
    $payload['special_promo_video_poster_url'] = '/storage/promo-videos/weekend.jpg';
    $payload['special_promo_card_1_title'] = 'Wisata keluarga';
    $payload['special_promo_card_1_image_url'] = '/storage/promo/family.jpg';
    $payload['special_promo_card_1_link_url'] = '/promo/wisata-keluarga';
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
            ->where('homeContent.featured.link_label', 'Jelajah semua wisata')
            ->where('partners.0.name', 'Partner Aktif')
            ->where('partners.0.image_url', '/storage/public-partners/partner-aktif.png')
            ->missing('partners.1'));
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
    $payload['special_promo_card_1_image_url_file'] = UploadedFile::fake()->image('promo-keluarga.jpg', 900, 600);
    $payload['special_promo_video_poster_url_file'] = UploadedFile::fake()->image('poster-video.jpg', 1280, 720);

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
