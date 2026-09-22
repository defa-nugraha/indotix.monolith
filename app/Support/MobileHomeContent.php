<?php

namespace App\Support;

use App\Models\MobileHomeHero;
use App\Models\MobilePromoBanner;
use Illuminate\Support\Facades\Storage;

class MobileHomeContent
{
    public const HERO_DEFAULTS = [
        'eyebrow' => 'Ayo berangkat',
        'title' => 'Saatnya',
        'highlight_title' => 'Liburan',
        'description' => 'Cari destinasi wisata dan tiket rekreasi favoritmu.',
        'cta_label' => 'Mulai Jelajah',
        'cta_url' => '/wisata',
        'media_type' => 'image',
        'media_path' => null,
        'poster_path' => null,
        'is_active' => true,
    ];

    public static function heroes(): array
    {
        $heroes = MobileHomeHero::query()->active()->get();
        if ($heroes->isEmpty()) {
            return [self::heroPayload(null)];
        }

        return $heroes->map(fn (MobileHomeHero $hero) => self::heroPayload($hero))->values()->all();
    }

    public static function hero(): array
    {
        return self::heroes()[0];
    }

    private static function heroPayload(?MobileHomeHero $hero): array
    {
        $data = array_merge(self::HERO_DEFAULTS, $hero?->toArray() ?? []);

        return [
            'id' => $hero?->id,
            'eyebrow' => $data['eyebrow'],
            'title' => $data['title'],
            'highlight' => $data['highlight_title'],
            'description' => $data['description'],
            'cta_label' => $data['cta_label'],
            'cta_url' => $data['cta_url'],
            'media_type' => $data['media_type'],
            'media_url' => self::url($data['media_path']),
            'poster_url' => self::url($data['poster_path']),
            'is_active' => (bool) $data['is_active'],
            'sort_order' => (int) ($data['sort_order'] ?? 0),
            'starts_at' => $hero?->starts_at?->toIso8601String(),
            'ends_at' => $hero?->ends_at?->toIso8601String(),
        ];
    }

    public static function promos(): array
    {
        return MobilePromoBanner::query()->active()->get()->map(fn (MobilePromoBanner $promo) => [
            'id' => $promo->id,
            'name' => $promo->name,
            'image_url' => self::url($promo->image_path),
            'alt_text' => $promo->alt_text ?: $promo->name,
            'target_url' => $promo->target_url,
        ])->values()->all();
    }

    public static function payload(): array
    {
        return ['heroes' => self::heroes(), 'promos' => self::promos()];
    }

    public static function url(?string $path): ?string
    {
        return $path ? Storage::disk('public')->url($path) : null;
    }
}
