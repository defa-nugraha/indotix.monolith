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
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'booking_timeout_minutes' => ['required', 'integer', 'min:1', 'max:1440'],
            'tax_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'service_fee' => ['required', 'numeric', 'min:0'],
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
