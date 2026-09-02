<?php

namespace App\Support;

use App\Models\SystemSetting;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class WisataEntryQrTemplate
{
    public const TEXT_LIMITS = [
        'scan_label' => 24,
        'lead_text' => 96,
        'main_title' => 42,
        'main_description' => 120,
        'website_label' => 60,
        'footer_step_one' => 16,
        'footer_step_two' => 16,
        'footer_step_three' => 16,
    ];

    public const IMAGE_KEYS = [
        'top_logo_1',
        'top_logo_2',
        'top_logo_3',
        'qr_logo',
        'background_image',
        'playstore_image',
    ];

    private const PREFIX = 'wisata_entry_qr_';

    private const DEFAULTS = [
        'scan_label' => 'Scan untuk Masuk',
        'lead_text' => 'Scan QR ini melalui menu Scan Tiket Indotix untuk memvalidasi tiket kunjungan Anda.',
        'main_title' => 'SATU QR UNTUK VALIDASI TIKET WISATA',
        'main_description' => 'Tempel QR ini di loket atau pintu masuk. User memilih tiket paid miliknya setelah scan.',
        'website_label' => 'indotix.co.id',
        'footer_step_one' => 'Scan QR',
        'footer_step_two' => 'Pilih Tiket',
        'footer_step_three' => 'Validasi',
        'top_logo_1' => 'logo.png',
        'top_logo_2' => null,
        'top_logo_3' => null,
        'qr_logo' => 'logo.png',
        'background_image' => 'images/qr/entry-mountain-bg.svg',
        'playstore_image' => 'images/playstore.png',
    ];

    public static function defaults(): array
    {
        return self::DEFAULTS;
    }

    public static function textLimits(): array
    {
        return self::TEXT_LIMITS;
    }

    public static function values(): array
    {
        $settings = SystemSetting::query()
            ->whereIn('key', collect(array_keys(self::DEFAULTS))->map(fn (string $key) => self::PREFIX.$key))
            ->get()
            ->keyBy('key');

        return collect(self::DEFAULTS)
            ->mapWithKeys(function ($default, string $key) use ($settings) {
                $settingKey = self::PREFIX.$key;
                if (! $settings->has($settingKey)) {
                    return [$key => $default];
                }

                $stored = $settings->get($settingKey)?->value;
                if (in_array($key, self::IMAGE_KEYS, true)) {
                    return [$key => $stored ?: null];
                }

                return [$key => $stored === null || $stored === '' ? $default : $stored];
            })
            ->all();
    }

    public static function formPayload(): array
    {
        $values = self::values();

        return [
            'values' => collect($values)
                ->mapWithKeys(fn ($value, string $key) => [
                    $key => in_array($key, self::IMAGE_KEYS, true) ? self::imageUrl($value) : $value,
                ])
                ->all(),
            'text_limits' => self::TEXT_LIMITS,
        ];
    }

    public static function publicPayload(): array
    {
        $values = self::values();

        return [
            ...$values,
            'top_logo_urls' => collect(['top_logo_1', 'top_logo_2', 'top_logo_3'])
                ->map(fn (string $key) => self::imageUrl($values[$key] ?? null))
                ->filter()
                ->values()
                ->all(),
            'qr_logo_url' => self::imageUrl($values['qr_logo'] ?? null),
            'background_image_url' => self::imageUrl($values['background_image'] ?? null),
            'playstore_image_url' => self::imageUrl($values['playstore_image'] ?? null),
        ];
    }

    public static function pdfPayload(): array
    {
        $values = self::values();

        return [
            ...$values,
            'top_logo_images' => collect(['top_logo_1', 'top_logo_2', 'top_logo_3'])
                ->map(fn (string $key) => self::imageDataUri($values[$key] ?? null))
                ->filter()
                ->values()
                ->all(),
            'qr_logo_image' => self::imageDataUri($values['qr_logo'] ?? null),
            'background_image' => self::imageDataUri($values['background_image'] ?? null),
            'playstore_image' => self::imageDataUri($values['playstore_image'] ?? null),
        ];
    }

    public static function persist(array $data, ?int $userId = null): void
    {
        foreach (self::TEXT_LIMITS as $key => $limit) {
            self::set($key, mb_substr(trim((string) ($data[$key] ?? self::DEFAULTS[$key])), 0, $limit), 'string', $userId);
        }
    }

    public static function storeImage(string $key, UploadedFile $file, ?int $userId = null): string
    {
        $previous = self::values()[$key] ?? null;
        $path = $file->store('wisata-entry-qr', 'public');

        self::set($key, $path, 'image', $userId);
        self::deleteStoredImage($previous);

        return $path;
    }

    public static function removeImage(string $key, ?int $userId = null): void
    {
        $previous = self::values()[$key] ?? null;
        self::set($key, null, 'image', $userId);
        self::deleteStoredImage($previous);
    }

    private static function set(string $key, ?string $value, string $type, ?int $userId): void
    {
        SystemSetting::query()->updateOrCreate(
            ['key' => self::PREFIX.$key],
            [
                'value' => $value,
                'type' => $type,
                'updated_by' => $userId,
            ],
        );
    }

    private static function imageUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        $normalizedPath = ltrim($path, '/');
        if (str_starts_with($normalizedPath, 'storage/')) {
            return asset($normalizedPath);
        }

        if (Storage::disk('public')->exists($path)) {
            return asset('storage/'.ltrim($path, '/'));
        }

        if (is_file(public_path($normalizedPath))) {
            return asset($normalizedPath);
        }

        return null;
    }

    private static function imageDataUri(?string $path): ?string
    {
        if (! $path || str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return null;
        }

        $normalizedPath = ltrim($path, '/');
        $absolutePath = null;
        if (str_starts_with($normalizedPath, 'storage/') && is_file(public_path($normalizedPath))) {
            $absolutePath = public_path($normalizedPath);
        } elseif (Storage::disk('public')->exists($path)) {
            $absolutePath = Storage::disk('public')->path($path);
        } elseif (is_file(public_path($normalizedPath))) {
            $absolutePath = public_path($normalizedPath);
        }

        if (! $absolutePath || ! is_file($absolutePath)) {
            return null;
        }

        $mime = mime_content_type($absolutePath) ?: 'image/png';

        return 'data:'.$mime.';base64,'.base64_encode((string) file_get_contents($absolutePath));
    }

    private static function deleteStoredImage(?string $path): void
    {
        if (! $path || in_array($path, self::DEFAULTS, true)) {
            return;
        }

        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }
}
