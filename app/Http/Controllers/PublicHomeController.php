<?php

namespace App\Http\Controllers;

use App\Models\BlogPost;
use App\Models\MitraWisataOnboarding;
use App\Models\PromoItem;
use App\Models\PublicBanner;
use App\Models\PublicContact;
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
            ->with('voucher')
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
            ->map(fn (PromoItem $promo) => $this->promoItemPayload($promo));
        $contact = PublicContact::query()->first();
        $wisataCards = MitraWisataOnboarding::query()
            ->publiclyVisible()
            ->with(['tickets'])
            ->latest('updated_at')
            ->take(12)
            ->get()
            ->map(fn (MitraWisataOnboarding $destination) => $this->wisataCardPayload($destination));
        $categorySections = $this->categorySections();

        $blogPosts = BlogPost::query()
            ->where('status', 'published')
            ->where(function ($query) {
                $query->whereNull('published_at')
                    ->orWhere('published_at', '<=', now());
            })
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->take(3)
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
            'contact' => $contact,
            'partners' => HomePageContent::publicPartners(),
            'wisataCards' => $wisataCards,
            'categorySections' => $categorySections,
            'blogPosts' => $blogPosts,
        ]);
    }

    private function categorySections(): array
    {
        $categoryLabels = $this->categoryLabels();
        $categoryOrder = array_flip(array_keys($categoryLabels));
        $types = MitraWisataOnboarding::query()
            ->publiclyVisible()
            ->whereNotNull('destination_type')
            ->where('destination_type', '!=', '')
            ->select('destination_type')
            ->distinct()
            ->pluck('destination_type')
            ->filter()
            ->sortBy(fn (string $type) => $categoryOrder[$type] ?? 999)
            ->values();

        return $types
            ->map(function (string $type) use ($categoryLabels) {
                $products = MitraWisataOnboarding::query()
                    ->publiclyVisible()
                    ->where('destination_type', $type)
                    ->with(['tickets'])
                    ->latest('updated_at')
                    ->take(3)
                    ->get()
                    ->map(fn (MitraWisataOnboarding $destination) => $this->wisataCardPayload($destination))
                    ->values();

                if ($products->isEmpty()) {
                    return null;
                }

                $label = $categoryLabels[$type] ?? str($type)->replace(['-', '_'], ' ')->title()->toString();

                return [
                    'key' => $type,
                    'title' => 'Wisata '.$label,
                    'description' => 'Pilihan destinasi '.$label.' yang bisa kamu jelajahi di Indotix.',
                    'href' => '/wisata?q='.urlencode($label),
                    'products' => $products,
                ];
            })
            ->filter()
            ->values()
            ->all();
    }

    private function wisataCardPayload(MitraWisataOnboarding $destination): array
    {
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
    }

    private function categoryLabels(): array
    {
        return [
            'alam' => 'Alam',
            'budaya' => 'Budaya',
            'edukasi' => 'Edukasi',
            'kuliner' => 'Kuliner',
            'desa_wisata' => 'Desa Wisata',
            'desa-wisata' => 'Desa Wisata',
            'religi' => 'Religi',
            'pantai' => 'Pantai',
            'gunung' => 'Gunung',
            'taman_nasional' => 'Taman Nasional',
            'taman-nasional' => 'Taman Nasional',
            'air_terjun' => 'Air Terjun',
            'air-terjun' => 'Air Terjun',
            'wahana' => 'Wahana',
            'event' => 'Event',
        ];
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

    private function promoItemPayload(PromoItem $promo): array
    {
        $remainingQuota = null;
        if ($promo->voucher && (int) $promo->voucher->quota_total > 0) {
            $remainingQuota = max(0, (int) $promo->voucher->quota_total - (int) $promo->voucher->quota_used);
        }

        return [
            'id' => $promo->id,
            'title' => $promo->title,
            'slug' => $promo->slug,
            'category' => $promo->category,
            'excerpt' => $promo->excerpt,
            'image_path' => $promo->image_path,
            'link_url' => $promo->link_url,
            'sort_order' => (int) $promo->sort_order,
            'voucher_code' => $promo->voucher?->code,
            'voucher_remaining_count' => $remainingQuota,
        ];
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
