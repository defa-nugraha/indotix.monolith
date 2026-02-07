<?php

namespace App\Http\Controllers\Admin\WisataAffiliate;

use App\Http\Controllers\Controller;
use App\Models\WisataAffiliateSetting;
use App\Models\WisataAffiliateAuditLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    public function index(): Response
    {
        $setting = WisataAffiliateSetting::query()->first();

        return Inertia::render('admin/wisata-affiliates/settings', [
            'setting' => $setting,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'cookie_days' => ['required', 'integer', 'min:1', 'max:365'],
            'attribution_model' => ['required', 'in:last_click,first_click'],
            'min_payout' => ['required', 'integer', 'min:0'],
            'payout_cutoff_days' => ['required', 'integer', 'min:1', 'max:31'],
        ]);

        $setting = WisataAffiliateSetting::query()->first();
        if (! $setting) {
            $setting = WisataAffiliateSetting::create($data);
        } else {
            $setting->update($data);
        }

        WisataAffiliateAuditLog::create([
            'admin_id' => $request->user()?->id,
            'action' => 'affiliate_settings_updated',
            'subject_type' => WisataAffiliateSetting::class,
            'subject_id' => $setting->id,
            'meta' => $data,
        ]);

        return back()->with('status', 'settings-updated');
    }
}
