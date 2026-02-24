<?php

namespace App\Http\Controllers;

use App\Models\AcademyClass;
use App\Models\AcademyTicket;
use App\Models\BlogPost;
use App\Models\Event;
use App\Models\EventTicket;
use App\Models\Hotel;
use App\Models\MitraWisataOnboarding;
use App\Models\PromoItem;
use App\Models\PromoVideo;
use App\Models\PublicBanner;
use App\Models\PublicContact;
use App\Models\PublicPartner;
use App\Models\SouvenirProduct;
use App\Models\SpecialProgram;
use App\Models\SpecialProgramItem;
use App\Models\WisataTicket;
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
        $promoVideo = PromoVideo::query()
            ->where('is_active', true)
            ->latest()
            ->first();
        $promoItems = PromoItem::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderByDesc('id')
            ->take(3)
            ->get();
        $contact = PublicContact::query()->first();
        $partners = PublicPartner::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderByDesc('id')
            ->get();
        $hotelCards = Hotel::query()
            ->where('status', 'active')
            ->with(['roomTypes', 'city', 'images'])
            ->latest()
            ->take(3)
            ->get()
            ->map(fn (Hotel $hotel) => [
                'id' => $hotel->id,
                'encrypted_id' => Crypt::encryptString((string) $hotel->id),
                'name' => $hotel->name,
                'city_name' => $hotel->city?->name,
                'star_rating' => $hotel->star_rating,
                'min_price' => $hotel->roomTypes->min('base_price')
                    ? (int) round($hotel->roomTypes->min('base_price'))
                    : null,
                'image_url' => $hotel->images->first()?->image_url ? '/storage/'.$hotel->images->first()->image_url : null,
            ]);
        $wisataCards = MitraWisataOnboarding::query()
            ->where('verification_status', 'verified')
            ->where('is_suspended', false)
            ->where('is_temporarily_closed', false)
            ->with(['tickets'])
            ->latest()
            ->take(3)
            ->get()
            ->map(function (MitraWisataOnboarding $destination) {
                $tickets = $destination->tickets->where('is_active', true)->where('is_closed', false);
                $minPrice = $tickets->min('price');

                return [
                    'id' => $destination->id,
                    'encrypted_id' => Crypt::encryptString((string) $destination->id),
                    'name' => $destination->destination_name,
                    'city_name' => DB::table('regencies')
                        ->where('code', $destination->city_code)
                        ->value('name'),
                    'min_price' => $minPrice ? (int) round($minPrice) : null,
                    'image_url' => $destination->photo_area_path ? '/storage/'.$destination->photo_area_path : null,
                    'type' => $destination->destination_type,
                ];
            });
        $eventCards = Event::query()
            ->where('status', 'published')
            ->with(['tickets'])
            ->latest('start_at')
            ->take(3)
            ->get()
            ->map(function (Event $event) {
                $minPrice = $event->tickets?->min('price');

                return [
                    'id' => $event->id,
                    'encrypted_id' => Crypt::encryptString((string) $event->id),
                    'title' => $event->title,
                    'city_name' => DB::table('regencies')
                        ->where('code', $event->city_code)
                        ->value('name'),
                    'start_at' => $event->start_at?->toDateString(),
                    'min_price' => $minPrice ? (int) round($minPrice) : null,
                ];
            });

        $specialPrograms = SpecialProgram::query()
            ->where('is_active', true)
            ->whereIn('status', ['active', 'scheduled'])
            ->orderByDesc('priority')
            ->get();

        $specialProgramItems = SpecialProgramItem::query()
            ->whereIn('special_program_id', $specialPrograms->pluck('id'))
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->take(6)
            ->get();

        $specialProgramItemsMapped = (function () use ($specialProgramItems) {
            $items = collect($specialProgramItems);
            $hotelIds = $items->where('item_type', 'hotel')->pluck('item_id');
            $wisataIds = $items->where('item_type', 'wisata')->pluck('item_id');
            $eventIds = $items->where('item_type', 'event')->pluck('item_id');

            $hotels = $hotelIds->isEmpty()
                ? collect()
                : Hotel::query()
                    ->whereIn('id', $hotelIds)
                    ->with('images', 'city', 'roomTypes')
                    ->get()
                    ->keyBy('id');

            $destinations = $wisataIds->isEmpty()
                ? collect()
                : MitraWisataOnboarding::query()
                    ->whereIn('id', $wisataIds)
                    ->get()
                    ->keyBy('id');

            $events = $eventIds->isEmpty()
                ? collect()
                : Event::query()
                    ->whereIn('id', $eventIds)
                    ->get()
                    ->keyBy('id');

            $wisataMinPrices = $wisataIds->isEmpty()
                ? collect()
                : WisataTicket::query()
                    ->whereIn('mitra_wisata_onboarding_id', $wisataIds)
                    ->select('mitra_wisata_onboarding_id', DB::raw('MIN(price) as min_price'))
                    ->groupBy('mitra_wisata_onboarding_id')
                    ->pluck('min_price', 'mitra_wisata_onboarding_id');

            $eventMinPrices = $eventIds->isEmpty()
                ? collect()
                : EventTicket::query()
                    ->whereIn('event_id', $eventIds)
                    ->select('event_id', DB::raw('MIN(price) as min_price'))
                    ->groupBy('event_id')
                    ->pluck('min_price', 'event_id');

            $results = [];
            foreach ($items as $item) {
                if ($item->item_type === 'hotel') {
                    $hotel = $hotels->get($item->item_id);
                    if (! $hotel) {
                        continue;
                    }
                    $minPrice = $hotel->roomTypes->min('base_price');
                    $results[] = [
                        'type' => 'hotel',
                        'id' => $hotel->id,
                        'encrypted_id' => Crypt::encryptString((string) $hotel->id),
                        'title' => $hotel->name,
                        'city_name' => $hotel->city?->name,
                        'image_url' => $hotel->images->first()?->image_url ? '/storage/'.$hotel->images->first()->image_url : null,
                        'price' => $minPrice ? (int) $minPrice : null,
                    ];
                    continue;
                }

                if ($item->item_type === 'wisata') {
                    $destination = $destinations->get($item->item_id);
                    if (! $destination) {
                        continue;
                    }
                    $results[] = [
                        'type' => 'wisata',
                        'id' => $destination->id,
                        'encrypted_id' => Crypt::encryptString((string) $destination->id),
                        'title' => $destination->destination_name,
                        'city_name' => DB::table('regencies')
                            ->where('code', $destination->city_code)
                            ->value('name'),
                        'image_url' => $destination->photo_area_path ? '/storage/'.$destination->photo_area_path : null,
                        'price' => $wisataMinPrices[$destination->id] ?? null,
                    ];
                    continue;
                }

                if ($item->item_type === 'event') {
                    $event = $events->get($item->item_id);
                    if (! $event) {
                        continue;
                    }
                    $results[] = [
                        'type' => 'event',
                        'id' => $event->id,
                        'encrypted_id' => Crypt::encryptString((string) $event->id),
                        'title' => $event->title,
                        'city_name' => DB::table('regencies')
                            ->where('code', $event->city_code)
                            ->value('name'),
                        'image_url' => null,
                        'price' => $eventMinPrices[$event->id] ?? null,
                    ];
                }
            }

            return $results;
        })();

        $souvenirCards = SouvenirProduct::query()
            ->where('status', 'active')
            ->where('is_active', true)
            ->with(['images'])
            ->latest()
            ->take(4)
            ->get()
            ->map(function (SouvenirProduct $product) {
                $image = $product->images->first()?->image_url;

                return [
                    'id' => $product->id,
                    'encrypted_id' => Crypt::encryptString((string) $product->id),
                    'name' => $product->name,
                    'price' => $product->price,
                    'image_url' => $image ? Storage::url($image) : null,
                ];
            });

        $academyCards = AcademyClass::query()
            ->where('is_active', true)
            ->whereIn('status', ['scheduled', 'open_for_sale'])
            ->with('images')
            ->latest('start_at')
            ->take(4)
            ->get()
            ->map(function (AcademyClass $class) {
                $minPrice = AcademyTicket::query()
                    ->where('academy_class_id', $class->id)
                    ->where('is_active', true)
                    ->min('price');
                $image = $class->images->first()?->image_path;

                return [
                    'id' => $class->id,
                    'encrypted_id' => Crypt::encryptString((string) $class->id),
                    'title' => $class->title,
                    'category' => $class->category,
                    'start_at' => $class->start_at?->toDateString(),
                    'min_price' => $minPrice ? (int) $minPrice : null,
                    'image_url' => $image ? Storage::url($image) : null,
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
            'banners' => $banners,
            'promoVideo' => $promoVideo,
            'promoItems' => $promoItems,
            'contact' => $contact,
            'partners' => $partners,
            'hotelCards' => $hotelCards,
            'specialProgramItems' => $specialProgramItemsMapped,
            'wisataCards' => $wisataCards,
            'eventCards' => $eventCards,
            'academyCards' => $academyCards,
            'souvenirCards' => $souvenirCards,
            'blogPosts' => $blogPosts,
        ]);
    }
}
