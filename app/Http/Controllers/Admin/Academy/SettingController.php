<?php

namespace App\Http\Controllers\Admin\Academy;

use App\Http\Controllers\Controller;
use App\Models\AcademySetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/academy/system/settings', [
            'setting' => AcademySetting::query()->first(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'booking_timeout_minutes' => ['required', 'integer', 'min:1'],
            'cutoff_minutes' => ['required', 'integer', 'min:0'],
            'refund_policy' => ['nullable', 'string'],
        ]);

        $setting = AcademySetting::query()->first();
        if ($setting) {
            $setting->update($data);
        } else {
            AcademySetting::create($data);
        }

        return back()->with('status', 'settings-updated');
    }
}
