<?php

use App\Models\BlogPost;
use App\Models\PrivacyPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('sitemap contains all public landing pages and published articles', function () {
    Cache::forget('public:sitemap:v2');
    BlogPost::query()->create([
        'title' => 'Panduan Wisata Keluarga',
        'slug' => 'panduan-wisata-keluarga',
        'excerpt' => 'Panduan memilih wisata keluarga.',
        'content' => '<p>Isi artikel.</p>',
        'status' => 'published',
        'published_at' => now()->subDay(),
    ]);

    $this->get('/sitemap.xml')
        ->assertOk()
        ->assertHeader('Content-Type', 'application/xml; charset=UTF-8')
        ->assertSee(url('/jelajah'), false)
        ->assertSee(url('/about'), false)
        ->assertSee(url('/faq'), false)
        ->assertSee(url('/privacy-policy'), false)
        ->assertSee(url('/terms-and-conditions'), false)
        ->assertSee(url('/refund-policy'), false)
        ->assertSee(url('/contact-us'), false)
        ->assertSee(url('/delete-account'), false)
        ->assertSee(url('/jelajah/panduan-wisata-keluarga'), false)
        ->assertDontSee(url('/jelajah-indotix'), false);
});

test('terms and conditions page uses active legal document content', function () {
    PrivacyPolicy::query()->create([
        'title' => 'Kebijakan Privasi Indotix',
        'content' => '<p>Konten privasi pengguna.</p>',
        'terms_content' => '<p>Konten syarat dan ketentuan pengguna.</p>',
        'version' => '2.0',
        'effective_at' => now()->toDateString(),
        'is_active' => true,
    ]);

    $this->get('/terms-and-conditions')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('public/privacy-policy')
            ->where('initialSection', 'terms')
            ->where('canonicalPath', '/terms-and-conditions')
            ->where('policy.terms_content', '<p>Konten syarat dan ketentuan pengguna.</p>'));
});

test('refund policy page follows the public terms page presentation', function () {
    PrivacyPolicy::query()->create([
        'title' => 'Kebijakan Privasi Indotix',
        'content' => '<p>Konten privasi pengguna.</p>',
        'terms_content' => '<p>Konten refund pengguna.</p>',
        'refund_content' => '<p>Konten refund pengguna.</p>',
        'version' => '2.0',
        'effective_at' => now()->toDateString(),
        'is_active' => true,
    ]);

    $this->get('/refund-policy')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('public/privacy-policy')
            ->where('initialSection', 'refund')
            ->where('canonicalPath', '/refund-policy')
            ->where('pageTitle', 'Refund Policy Indotix')
            ->where('policy.refund_content', '<p>Konten refund pengguna.</p>'));
});

test('published article exposes its custom seo fields to the public page', function () {
    BlogPost::query()->create([
        'title' => 'Destinasi Wisata Bandung',
        'slug' => 'destinasi-wisata-bandung',
        'excerpt' => 'Rekomendasi destinasi wisata Bandung.',
        'content' => '<p>Isi artikel Bandung.</p>',
        'meta_title' => 'Destinasi Wisata Bandung Terbaik - Indotix',
        'meta_description' => 'Temukan destinasi wisata Bandung pilihan untuk keluarga.',
        'meta_keywords' => 'wisata Bandung, tiket wisata Bandung',
        'status' => 'published',
        'published_at' => now()->subHour(),
    ]);

    $this->get('/jelajah/destinasi-wisata-bandung')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('public/blog/show')
            ->where('post.meta_title', 'Destinasi Wisata Bandung Terbaik - Indotix')
            ->where('post.meta_description', 'Temukan destinasi wisata Bandung pilihan untuk keluarga.')
            ->where('post.meta_keywords', 'wisata Bandung, tiket wisata Bandung'));
});
