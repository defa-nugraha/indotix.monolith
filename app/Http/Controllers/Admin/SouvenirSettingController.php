<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SouvenirSettingController extends Controller
{
    private const DEFAULTS = [
        'souvenir_tax_rate' => '0',
        'souvenir_packing_fee' => '0',
        'souvenir_default_shipping_fee' => '0',
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

        return Inertia::render('admin/souvenir/settings/index', [
            'settings' => [
                'souvenir_tax_rate' => (float) ($settings['souvenir_tax_rate'] ?? self::DEFAULTS['souvenir_tax_rate']),
                'souvenir_packing_fee' => (int) ($settings['souvenir_packing_fee'] ?? self::DEFAULTS['souvenir_packing_fee']),
                'souvenir_default_shipping_fee' => (int) ($settings['souvenir_default_shipping_fee'] ?? self::DEFAULTS['souvenir_default_shipping_fee']),
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'souvenir_tax_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'souvenir_packing_fee' => ['required', 'integer', 'min:0'],
            'souvenir_default_shipping_fee' => ['required', 'integer', 'min:0'],
        ]);

        foreach ($data as $key => $value) {
            SystemSetting::query()->updateOrCreate(
                ['key' => $key],
                ['value' => (string) $value, 'type' => 'number', 'updated_by' => $request->user()->id]
            );
        }

        return back()->with('status', 'souvenir-settings-updated');
    }
}
