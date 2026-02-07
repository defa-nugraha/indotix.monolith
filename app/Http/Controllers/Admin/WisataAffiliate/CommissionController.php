<?php

namespace App\Http\Controllers\Admin\WisataAffiliate;

use App\Http\Controllers\Controller;
use App\Models\WisataAffiliateCommission;
use App\Models\WisataAffiliateAuditLog;
use App\Models\WisataDestination;
use App\Models\WisataAffiliateCampaign;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CommissionController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/wisata-affiliates/commissions', [
            'commissions' => WisataAffiliateCommission::query()->latest('id')->get(),
            'destinations' => WisataDestination::query()->select('id', 'name')->orderBy('name')->get(),
            'campaigns' => WisataAffiliateCampaign::query()->select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'scope_type' => ['required', 'in:global,wisata,campaign'],
            'wisata_id' => ['nullable', 'integer'],
            'campaign_id' => ['nullable', 'integer'],
            'type' => ['required', 'in:percentage,nominal'],
            'value' => ['required', 'integer', 'min:0'],
            'source' => ['required', 'in:platform,subsidi_promo'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
        ]);

        $commission = WisataAffiliateCommission::create([
            ...$data,
            'created_by' => $request->user()?->id,
        ]);

        WisataAffiliateAuditLog::create([
            'admin_id' => $request->user()?->id,
            'action' => 'commission_created',
            'subject_type' => WisataAffiliateCommission::class,
            'subject_id' => $commission->id,
            'meta' => $data,
        ]);

        return back()->with('status', 'commission-created');
    }
}
