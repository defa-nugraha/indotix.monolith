<?php

namespace App\Support;

use App\Models\SystemSetting;

class HomePageContent
{
    public const ICON_OPTIONS = [
        'BadgePercent' => 'Persen / Voucher',
        'Gift' => 'Hadiah / Promo',
        'Navigation' => 'Lokasi / Rekomendasi',
        'BookOpen' => 'Artikel / Jelajah',
        'ShieldCheck' => 'Aman / Terverifikasi',
        'Ticket' => 'Tiket',
        'Bell' => 'Notifikasi',
        'RefreshCcw' => 'Bantuan / Update',
        'MapPin' => 'Lokasi',
        'Sparkles' => 'Unggulan',
        'Mountain' => 'Alam / Gunung',
        'Landmark' => 'Budaya / Landmark',
        'GraduationCap' => 'Edukasi',
        'Utensils' => 'Kuliner',
        'HomeIcon' => 'Desa / Rumah',
        'Waves' => 'Pantai / Laut',
        'Trees' => 'Hutan / Taman Nasional',
        'Droplets' => 'Air / Danau',
        'Compass' => 'Jelajah / Kompas',
    ];

    public const DEFAULTS = [
        'search_placeholder' => 'Cari kota, destinasi, atau tiket wisata...',
        'search_button_label' => 'Cari',
        'category_1_icon' => 'Mountain',
        'category_1_label' => 'Alam',
        'category_2_icon' => 'Landmark',
        'category_2_label' => 'Budaya',
        'category_3_icon' => 'GraduationCap',
        'category_3_label' => 'Edukasi',
        'category_4_icon' => 'Utensils',
        'category_4_label' => 'Kuliner',
        'category_5_icon' => 'HomeIcon',
        'category_5_label' => 'Desa Wisata',
        'category_6_icon' => 'Sparkles',
        'category_6_label' => 'Religi',
        'category_7_icon' => 'Waves',
        'category_7_label' => 'Pantai',
        'category_8_icon' => 'Trees',
        'category_8_label' => 'Gunung',
        'category_9_icon' => 'Trees',
        'category_9_label' => 'Taman Nasional',
        'category_10_icon' => 'Droplets',
        'category_10_label' => 'Air Terjun',
        'coupon_icon' => 'BadgePercent',
        'coupon_title' => 'Kupon Diskon 12% untuk Pengguna Baru',
        'coupon_description' => 'Berlaku untuk transaksi pertama di aplikasi Indotix',
        'promo_icon' => 'Gift',
        'promo_title' => 'Promo terbaik buat liburan irit!',
        'promo_link_label' => 'Lihat Semua Promo',
        'featured_title' => 'Destinasi Wisata Unggulan',
        'featured_description' => 'Pilihan tempat wisata aktif yang tersedia di Indotix.',
        'featured_link_label' => 'Lihat semua',
        'nearby_icon' => 'Navigation',
        'nearby_eyebrow' => 'Rekomendasi Terdekat',
        'nearby_title' => 'Wisata lainnya yang bisa kamu jelajahi',
        'nearby_description' => 'Aktifkan lokasi untuk mengurutkan destinasi berdasarkan jarak dari posisi kamu.',
        'nearby_button_default' => 'Gunakan lokasi saya',
        'nearby_button_active' => 'Perbarui lokasi',
        'nearby_button_loading' => 'Mengambil lokasi...',
        'blog_icon' => 'BookOpen',
        'blog_eyebrow' => 'Jelajah Indotix',
        'blog_title' => 'Cerita dan inspirasi wisata',
        'blog_description' => 'Baca panduan dan cerita terbaru sebelum memilih destinasi.',
        'blog_link_label' => 'Lihat semua artikel',
        'trust_eyebrow' => 'Kenapa pesan di Indotix?',
        'trust_title' => 'Tiket wisata lebih mudah, aman, dan praktis',
        'trust_badge_1_icon' => 'ShieldCheck',
        'trust_badge_1_text' => 'Transaksi aman',
        'trust_badge_2_icon' => 'Ticket',
        'trust_badge_2_text' => 'E-tiket praktis',
        'trust_cta_label' => 'Download Aplikasi Indotix',
        'trust_card_1_icon' => 'BadgePercent',
        'trust_card_1_title' => 'Promo khusus aplikasi',
        'trust_card_1_description' => 'Dapatkan info promo dan voucher aktif langsung dari aplikasi Indotix.',
        'trust_card_2_icon' => 'RefreshCcw',
        'trust_card_2_title' => 'Bantuan pesanan lebih mudah',
        'trust_card_2_description' => 'Pantau status tiket dan kebutuhan perjalanan dalam satu tempat.',
        'trust_card_3_icon' => 'Bell',
        'trust_card_3_title' => 'Notifikasi instan',
        'trust_card_3_description' => 'Terima update pesanan, e-tiket, dan informasi penting secara langsung.',
    ];

    public static function keys(): array
    {
        return array_map(fn (string $key) => "home_{$key}", array_keys(self::DEFAULTS));
    }

    public static function values(): array
    {
        $settings = SystemSetting::query()
            ->whereIn('key', self::keys())
            ->get()
            ->keyBy('key');

        return collect(self::DEFAULTS)
            ->mapWithKeys(function (string $default, string $key) use ($settings) {
                $value = $settings->get("home_{$key}")?->value;

                return [$key => is_string($value) && $value !== '' ? $value : $default];
            })
            ->all();
    }

    public static function publicPayload(): array
    {
        $values = self::values();

        return [
            'search' => [
                'placeholder' => $values['search_placeholder'],
                'button_label' => $values['search_button_label'],
            ],
            'categories' => collect(range(1, 10))
                ->map(fn (int $index) => [
                    'icon' => $values["category_{$index}_icon"],
                    'label' => $values["category_{$index}_label"],
                ])
                ->filter(fn (array $category) => trim($category['label']) !== '')
                ->values()
                ->all(),
            'coupon' => self::only($values, ['icon', 'title', 'description'], 'coupon_'),
            'promo' => self::only($values, ['icon', 'title', 'link_label'], 'promo_'),
            'featured' => self::only($values, ['title', 'description', 'link_label'], 'featured_'),
            'nearby' => self::only($values, ['icon', 'eyebrow', 'title', 'description', 'button_default', 'button_active', 'button_loading'], 'nearby_'),
            'blog' => self::only($values, ['icon', 'eyebrow', 'title', 'description', 'link_label'], 'blog_'),
            'trust' => [
                'eyebrow' => $values['trust_eyebrow'],
                'title' => $values['trust_title'],
                'badges' => [
                    ['icon' => $values['trust_badge_1_icon'], 'text' => $values['trust_badge_1_text']],
                    ['icon' => $values['trust_badge_2_icon'], 'text' => $values['trust_badge_2_text']],
                ],
                'cta_label' => $values['trust_cta_label'],
                'cards' => [
                    self::only($values, ['icon', 'title', 'description'], 'trust_card_1_'),
                    self::only($values, ['icon', 'title', 'description'], 'trust_card_2_'),
                    self::only($values, ['icon', 'title', 'description'], 'trust_card_3_'),
                ],
            ],
        ];
    }

    public static function formPayload(): array
    {
        return [
            'values' => self::values(),
            'defaults' => self::DEFAULTS,
            'icon_options' => self::ICON_OPTIONS,
        ];
    }

    public static function validationRules(): array
    {
        return collect(self::DEFAULTS)
            ->mapWithKeys(fn (string $default, string $key) => [
                $key => str_ends_with($key, '_icon')
                    ? ['required', 'string', 'in:'.implode(',', array_keys(self::ICON_OPTIONS))]
                    : ['required', 'string', 'max:255'],
            ])
            ->all();
    }

    public static function persist(array $data, ?int $userId): void
    {
        foreach (self::DEFAULTS as $key => $default) {
            SystemSetting::query()->updateOrCreate(
                ['key' => "home_{$key}"],
                [
                    'value' => (string) ($data[$key] ?? $default),
                    'type' => 'string',
                    'updated_by' => $userId,
                ],
            );
        }
    }

    private static function only(array $values, array $keys, string $prefix): array
    {
        return collect($keys)
            ->mapWithKeys(fn (string $key) => [$key => $values["{$prefix}{$key}"]])
            ->all();
    }
}
