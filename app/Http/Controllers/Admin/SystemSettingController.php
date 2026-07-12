<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use App\Services\MaintenanceMode;
use App\Services\SystemResetService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SystemSettingController extends Controller
{
    private const DEFAULTS = [
        'hotel_booking_timeout_minutes' => '15',
        'booking_timeout_minutes' => '15',
        'tax_rate' => '0',
        'service_fee' => '0',
        'wisata_booking_timeout_minutes' => '15',
        'event_booking_timeout_minutes' => '15',
        'academy_booking_timeout_minutes' => '15',
        'special_program_booking_timeout_minutes' => '15',
        'retail_shop_booking_timeout_minutes' => '15',
        'public_whatsapp_number' => '',
        MaintenanceMode::ENABLED_KEY => '0',
        MaintenanceMode::MESSAGE_KEY => MaintenanceMode::DEFAULT_MESSAGE,
    ];

    public function index(SystemResetService $systemReset): Response
    {
        foreach (self::DEFAULTS as $key => $value) {
            SystemSetting::query()->firstOrCreate(
                ['key' => $key],
                ['value' => $value, 'type' => $this->settingType($key)]
            );
        }

        $settings = SystemSetting::query()
            ->whereIn('key', array_keys(self::DEFAULTS))
            ->get()
            ->keyBy('key')
            ->map(fn ($setting) => $setting->value);

        return Inertia::render('admin/system/settings/index', [
            'settings' => [
                'hotel_booking_timeout_minutes' => (int) ($settings['hotel_booking_timeout_minutes'] ?? $settings['booking_timeout_minutes'] ?? self::DEFAULTS['hotel_booking_timeout_minutes']),
                'wisata_booking_timeout_minutes' => (int) ($settings['wisata_booking_timeout_minutes'] ?? self::DEFAULTS['wisata_booking_timeout_minutes']),
                'event_booking_timeout_minutes' => (int) ($settings['event_booking_timeout_minutes'] ?? self::DEFAULTS['event_booking_timeout_minutes']),
                'academy_booking_timeout_minutes' => (int) ($settings['academy_booking_timeout_minutes'] ?? self::DEFAULTS['academy_booking_timeout_minutes']),
                'special_program_booking_timeout_minutes' => (int) ($settings['special_program_booking_timeout_minutes'] ?? self::DEFAULTS['special_program_booking_timeout_minutes']),
                'retail_shop_booking_timeout_minutes' => (int) ($settings['retail_shop_booking_timeout_minutes'] ?? self::DEFAULTS['retail_shop_booking_timeout_minutes']),
                'public_whatsapp_number' => (string) ($settings['public_whatsapp_number'] ?? self::DEFAULTS['public_whatsapp_number']),
                MaintenanceMode::ENABLED_KEY => filter_var($settings[MaintenanceMode::ENABLED_KEY] ?? self::DEFAULTS[MaintenanceMode::ENABLED_KEY], FILTER_VALIDATE_BOOL),
                MaintenanceMode::MESSAGE_KEY => (string) ($settings[MaintenanceMode::MESSAGE_KEY] ?? self::DEFAULTS[MaintenanceMode::MESSAGE_KEY]),
            ],
            'resetStats' => $systemReset->stats(),
            'canResetSystem' => request()->user()?->role === 'admin',
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'hotel_booking_timeout_minutes' => ['required', 'integer', 'min:1', 'max:1440'],
            'wisata_booking_timeout_minutes' => ['required', 'integer', 'min:1', 'max:1440'],
            'event_booking_timeout_minutes' => ['required', 'integer', 'min:1', 'max:1440'],
            'academy_booking_timeout_minutes' => ['required', 'integer', 'min:1', 'max:1440'],
            'special_program_booking_timeout_minutes' => ['required', 'integer', 'min:1', 'max:1440'],
            'retail_shop_booking_timeout_minutes' => ['required', 'integer', 'min:1', 'max:1440'],
            'public_whatsapp_number' => ['nullable', 'string', 'max:30', 'regex:/^[0-9+().\\s-]*$/'],
            MaintenanceMode::ENABLED_KEY => ['required', 'boolean'],
            MaintenanceMode::MESSAGE_KEY => ['required', 'string', 'max:500'],
        ]);

        $data['booking_timeout_minutes'] = $data['hotel_booking_timeout_minutes'];

        foreach ($data as $key => $value) {
            SystemSetting::query()->updateOrCreate(
                ['key' => $key],
                ['value' => (string) $value, 'type' => $this->settingType($key), 'updated_by' => $request->user()->id]
            );
        }

        return back()->with('status', 'settings-updated');
    }

    public function reset(Request $request, SystemResetService $systemReset): RedirectResponse
    {
        abort_unless($request->user()?->role === 'admin', 403);

        $request->validate([
            'confirmation' => ['required', 'string', 'in:RESET SISTEM'],
            'sections' => ['required', 'array', 'min:1'],
            'sections.*' => ['required', 'string', Rule::in($systemReset->sectionKeys())],
        ]);

        $result = $systemReset->reset($request->input('sections', []));

        return back()->with('status', 'system-reset')->with('reset_result', $result);
    }

    private function settingType(string $key): string
    {
        return match ($key) {
            MaintenanceMode::ENABLED_KEY => 'boolean',
            MaintenanceMode::MESSAGE_KEY, 'public_whatsapp_number' => 'string',
            default => 'number',
        };
    }
}
