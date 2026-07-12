<?php

namespace App\Http\Controllers;

use App\Models\BlogPost;
use App\Models\MitraWisataOnboarding;
use App\Models\PromoItem;
use App\Models\PublicBanner;
use App\Models\PublicContact;
use App\Models\Voucher;
use App\Support\HomePageContent;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Laravel\Fortify\Features;

class PublicHomeController extends Controller
{
    public function index()
    {
        $banners = PublicBanner::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderByDesc('id')
            ->get();
        $promoItems = PromoItem::query()
            ->where('is_active', true)
            ->whereBetween('sort_order', [1, 3])
            ->where(function ($query) {
                $query->whereNull('starts_at')
                    ->orWhereDate('starts_at', '<=', now()->toDateString());
            })
            ->where(function ($query) {
                $query->whereNull('ends_at')
                    ->orWhereDate('ends_at', '>=', now()->toDateString());
            })
            ->orderBy('sort_order')
            ->orderByDesc('id')
            ->take(3)
            ->get()
            ->map(fn (PromoItem $promo) => [
                'id' => $promo->id,
                'title' => $promo->title,
                'slug' => $promo->slug,
                'category' => $promo->category,
                'excerpt' => $promo->excerpt,
                'image_path' => $promo->image_path,
                'link_url' => $promo->link_url,
                'sort_order' => (int) $promo->sort_order,
            ]);
        $promoVouchers = Voucher::query()
            ->where('is_active', true)
            ->where(function ($query) {
                $query->whereNull('starts_at')
                    ->orWhereDate('starts_at', '<=', now()->toDateString());
            })
            ->where(function ($query) {
                $query->whereNull('ends_at')
                    ->orWhereDate('ends_at', '>=', now()->toDateString());
            })
            ->where(function ($query) {
                $query->where('quota_total', 0)
                    ->orWhereColumn('quota_used', '<', 'quota_total');
            })
            ->orderByRaw("case when discount_type = 'percentage' then discount_value else 0 end desc")
            ->orderByDesc('discount_value')
            ->take(6)
            ->get()
            ->map(fn (Voucher $voucher) => [
                'id' => $voucher->id,
                'code' => $voucher->code,
                'discount_type' => $voucher->discount_type,
                'discount_value' => (int) $voucher->discount_value,
                'min_transaction' => (int) ($voucher->min_transaction ?? 0),
                'quota_total' => (int) $voucher->quota_total,
                'quota_used' => (int) $voucher->quota_used,
                'starts_at' => $voucher->starts_at?->toDateString(),
                'ends_at' => $voucher->ends_at?->toDateString(),
            ]);
        $contact = PublicContact::query()->first();
        $wisataCards = MitraWisataOnboarding::query()
            ->publiclyVisible()
            ->with(['tickets'])
            ->latest('updated_at')
            ->take(12)
            ->get()
            ->map(function (MitraWisataOnboarding $destination) {
                $tickets = $destination->tickets->where('is_active', true)->where('is_closed', false);
                $minPrice = $tickets->min('price');

                return [
                    'id' => $destination->id,
                    'encrypted_id' => Crypt::encryptString((string) $destination->id),
                    'slug' => $destination->slug,
                    'name' => $destination->destination_name,
                    'description' => $destination->description,
                    'city_name' => DB::table('regencies')
                        ->where('code', $destination->city_code)
                        ->value('name'),
                    'min_price' => $minPrice ? (int) round($minPrice) : null,
                    'image_url' => $destination->photo_area_path ? '/storage/'.$destination->photo_area_path : null,
                    'type' => $destination->destination_type,
                    'latitude' => $this->extractLatitude($destination->maps_pin_url),
                    'longitude' => $this->extractLongitude($destination->maps_pin_url),
                ];
            });

        $blogPosts = BlogPost::query()
            ->where('status', 'published')
            ->where(function ($query) {
                $query->whereNull('published_at')
                    ->orWhere('published_at', '<=', now());
            })
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->take(4)
            ->get()
            ->map(fn (BlogPost $post) => [
                'id' => $post->id,
                'title' => $post->title,
                'slug' => $post->slug,
                'excerpt' => $post->excerpt,
                'label' => $post->label,
                'cover_image_url' => $post->cover_image_path ? Storage::url($post->cover_image_path) : null,
                'published_at' => $post->published_at?->toDateString(),
            ]);

        return Inertia::render('welcome', [
            'canRegister' => Features::enabled(Features::registration()),
            'homeContent' => HomePageContent::publicPayload(),
            'banners' => $banners,
            'promoItems' => $promoItems,
            'promoVouchers' => $promoVouchers,
            'contact' => $contact,
            'wisataCards' => $wisataCards,
            'blogPosts' => $blogPosts,
        ]);
    }

    private function extractLatitude(?string $mapsUrl): ?float
    {
        if (! $mapsUrl) {
            return null;
        }

        if (preg_match('/@(-?\d+\.\d+),(-?\d+\.\d+)/', $mapsUrl, $matches)) {
            return (float) $matches[1];
        }

        if (preg_match('/q=(-?\d+\.\d+),(-?\d+\.\d+)/', $mapsUrl, $matches)) {
            return (float) $matches[1];
        }

        return null;
    }

    private function extractLongitude(?string $mapsUrl): ?float
    {
        if (! $mapsUrl) {
            return null;
        }

        if (preg_match('/@(-?\d+\.\d+),(-?\d+\.\d+)/', $mapsUrl, $matches)) {
            return (float) $matches[2];
        }

        if (preg_match('/q=(-?\d+\.\d+),(-?\d+\.\d+)/', $mapsUrl, $matches)) {
            return (float) $matches[2];
        }

        return null;
    }
}
