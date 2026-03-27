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
use App\Models\SpecialProgram;
use App\Models\SouvenirProduct;
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
                'slug' => $hotel->slug,
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
                    'slug' => $destination->slug,
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
            ->where('event_type', 'event')
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
                    'slug' => $event->slug,
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
            ->with('variants')
            ->latest()
            ->take(6)
            ->get();

        $specialProgramItemsMapped = $specialPrograms->map(function (SpecialProgram $program) {
            $variantMin = $program->variants->whereNotNull('price')->min('price');
            $minPrice = $variantMin !== null ? (int) $variantMin : (int) $program->base_price;

            return [
                'type' => 'special_program',
                'id' => $program->id,
                'encrypted_id' => Crypt::encryptString((string) $program->id),
                'slug' => $program->slug,
                'name' => $program->name,
                'category' => $program->category,
                'image_url' => $program->image_path ? Storage::url($program->image_path) : null,
                'price' => $minPrice > 0 ? $minPrice : null,
            ];
        });

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
                    'slug' => $product->slug,
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
                    'slug' => $class->slug,
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
