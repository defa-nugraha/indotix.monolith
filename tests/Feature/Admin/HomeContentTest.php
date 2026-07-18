<?php

use App\Models\SystemSetting;
use App\Models\User;
use App\Support\HomePageContent;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
            ->where('content.values.search_placeholder', HomePageContent::DEFAULTS['search_placeholder'])
            ->where('content.values.coupon_title', HomePageContent::DEFAULTS['coupon_title'])
            ->where('content.icon_options.Gift', HomePageContent::ICON_OPTIONS['Gift']));

    $payload = HomePageContent::DEFAULTS;
    $payload['search_placeholder'] = 'Cari wisata keluarga favoritmu';
    $payload['category_1_label'] = 'Keluarga';
    $payload['category_1_icon'] = 'Sparkles';
    $payload['coupon_title'] = 'Voucher khusus keluarga';
    $payload['coupon_icon'] = 'Gift';
    $payload['special_promo_title'] = 'Promo spesial akhir pekan';
    $payload['special_promo_video_url'] = '/storage/promo-videos/weekend.mp4';
    $payload['special_promo_video_poster_url'] = '/storage/promo-videos/weekend.jpg';
    $payload['special_promo_card_1_title'] = 'Wisata keluarga';
    $payload['special_promo_card_1_image_url'] = '/storage/promo/family.jpg';
    $payload['special_promo_card_1_link_url'] = '/promo/wisata-keluarga';
    $payload['promo_title'] = 'Promo liburan pilihan';
    $payload['featured_link_label'] = 'Jelajah semua wisata';

    $this->actingAs($admin)
        ->put('/admin/public/home', $payload)
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect(SystemSetting::query()->where('key', 'home_search_placeholder')->value('value'))->toBe('Cari wisata keluarga favoritmu')
        ->and(SystemSetting::query()->where('key', 'home_category_1_label')->value('value'))->toBe('Keluarga')
        ->and(SystemSetting::query()->where('key', 'home_category_1_icon')->value('value'))->toBe('Sparkles')
        ->and(SystemSetting::query()->where('key', 'home_coupon_title')->value('value'))->toBe('Voucher khusus keluarga')
        ->and(SystemSetting::query()->where('key', 'home_coupon_icon')->value('value'))->toBe('Gift')
        ->and(SystemSetting::query()->where('key', 'home_special_promo_title')->value('value'))->toBe('Promo spesial akhir pekan')
        ->and(SystemSetting::query()->where('key', 'home_special_promo_video_url')->value('value'))->toBe('/storage/promo-videos/weekend.mp4')
        ->and(SystemSetting::query()->where('key', 'home_special_promo_card_1_image_url')->value('value'))->toBe('/storage/promo/family.jpg')
        ->and(SystemSetting::query()->where('key', 'home_promo_title')->value('value'))->toBe('Promo liburan pilihan')
        ->and(SystemSetting::query()->where('key', 'home_featured_link_label')->value('value'))->toBe('Jelajah semua wisata');

    $this->get('/')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('welcome')
            ->where('homeContent.search.placeholder', 'Cari wisata keluarga favoritmu')
            ->where('homeContent.categories.0.label', 'Keluarga')
            ->where('homeContent.categories.0.icon', 'Sparkles')
            ->where('homeContent.coupon.title', 'Voucher khusus keluarga')
            ->where('homeContent.coupon.icon', 'Gift')
            ->where('homeContent.special_promo.title', 'Promo spesial akhir pekan')
            ->where('homeContent.special_promo.video.url', '/storage/promo-videos/weekend.mp4')
            ->where('homeContent.special_promo.cards.0.title', 'Wisata keluarga')
            ->where('homeContent.special_promo.cards.0.image_url', '/storage/promo/family.jpg')
            ->where('homeContent.promo.title', 'Promo liburan pilihan')
            ->where('homeContent.featured.link_label', 'Jelajah semua wisata'));
});
