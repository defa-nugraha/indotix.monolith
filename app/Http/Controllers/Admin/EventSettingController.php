<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EventSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EventSettingController extends Controller
{
    public function index(): Response
    {
        $setting = EventSetting::query()->first();

        return Inertia::render('admin/events/system/settings', [
            'setting' => $setting,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'booking_timeout_minutes' => ['required', 'integer', 'min:1'],
            'max_ticket_per_user' => ['required', 'integer', 'min:1'],
            'sales_cutoff_minutes' => ['required', 'integer', 'min:0'],
            'refund_policy' => ['nullable', 'string'],
        ]);

        $setting = EventSetting::query()->first();
        if (! $setting) {
            EventSetting::create($data);
        } else {
            $setting->update($data);
        }

        return back();
    }
}
