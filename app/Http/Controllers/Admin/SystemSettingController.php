<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SystemSettingController extends Controller
{
    private const DEFAULTS = [
        'booking_timeout_minutes' => '15',
        'tax_rate' => '0',
        'service_fee' => '0',
        'wisata_booking_timeout_minutes' => '15',
        'wisata_max_quota_per_ticket' => '1000',
        'wisata_refund_policy' => 'Manual review',
    ];

    public function index(): Response
    {
        foreach (self::DEFAULTS as $key => $value) {
            SystemSetting::query()->firstOrCreate(
                ['key' => $key],
                ['value' => $value, 'type' => 'number']
            );
        }

        $settings = SystemSetting::query()
            ->whereIn('key', array_keys(self::DEFAULTS))
            ->get()
            ->keyBy('key')
            ->map(fn ($setting) => $setting->value);

        return Inertia::render('admin/system/settings/index', [
            'settings' => [
                'booking_timeout_minutes' => (int) ($settings['booking_timeout_minutes'] ?? self::DEFAULTS['booking_timeout_minutes']),
                'tax_rate' => (float) ($settings['tax_rate'] ?? self::DEFAULTS['tax_rate']),
                'service_fee' => (float) ($settings['service_fee'] ?? self::DEFAULTS['service_fee']),
                'wisata_booking_timeout_minutes' => (int) ($settings['wisata_booking_timeout_minutes'] ?? self::DEFAULTS['wisata_booking_timeout_minutes']),
                'wisata_max_quota_per_ticket' => (int) ($settings['wisata_max_quota_per_ticket'] ?? self::DEFAULTS['wisata_max_quota_per_ticket']),
                'wisata_refund_policy' => (string) ($settings['wisata_refund_policy'] ?? self::DEFAULTS['wisata_refund_policy']),
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'booking_timeout_minutes' => ['required', 'integer', 'min:1', 'max:1440'],
            'tax_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'service_fee' => ['required', 'numeric', 'min:0'],
            'wisata_booking_timeout_minutes' => ['required', 'integer', 'min:1', 'max:1440'],
            'wisata_max_quota_per_ticket' => ['required', 'integer', 'min:1'],
            'wisata_refund_policy' => ['required', 'string', 'max:255'],
        ]);

        foreach ($data as $key => $value) {
            SystemSetting::query()->updateOrCreate(
                ['key' => $key],
                ['value' => (string) $value, 'type' => 'number', 'updated_by' => $request->user()->id]
            );
        }

        return back()->with('status', 'settings-updated');
    }
}
