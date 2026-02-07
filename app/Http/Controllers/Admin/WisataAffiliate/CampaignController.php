<?php

namespace App\Http\Controllers\Admin\WisataAffiliate;

use App\Http\Controllers\Controller;
use App\Models\WisataAffiliateCampaign;
use App\Models\WisataAffiliateAuditLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CampaignController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/wisata-affiliates/campaigns', [
            'campaigns' => WisataAffiliateCampaign::query()->latest('id')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'status' => ['required', 'in:draft,active,paused,ended'],
            'bonus_type' => ['nullable', 'in:percentage,nominal'],
            'bonus_value' => ['nullable', 'integer', 'min:0'],
            'leaderboard_enabled' => ['nullable', 'boolean'],
        ]);

        $campaign = WisataAffiliateCampaign::create([
            ...$data,
            'leaderboard_enabled' => (bool) ($data['leaderboard_enabled'] ?? false),
        ]);

        WisataAffiliateAuditLog::create([
            'admin_id' => $request->user()?->id,
            'action' => 'campaign_created',
            'subject_type' => WisataAffiliateCampaign::class,
            'subject_id' => $campaign->id,
            'meta' => $data,
        ]);

        return back()->with('status', 'campaign-created');
    }

    public function updateStatus(Request $request, WisataAffiliateCampaign $campaign): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:draft,active,paused,ended'],
        ]);

        $campaign->update($data);

        WisataAffiliateAuditLog::create([
            'admin_id' => $request->user()?->id,
            'action' => 'campaign_status_updated',
            'subject_type' => WisataAffiliateCampaign::class,
            'subject_id' => $campaign->id,
            'meta' => $data,
        ]);

        return back()->with('status', 'campaign-status-updated');
    }
}
