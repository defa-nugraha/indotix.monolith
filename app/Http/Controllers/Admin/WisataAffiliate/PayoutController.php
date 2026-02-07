<?php

namespace App\Http\Controllers\Admin\WisataAffiliate;

use App\Http\Controllers\Controller;
use App\Models\WisataAffiliate;
use App\Models\WisataAffiliatePayout;
use App\Models\WisataAffiliateAuditLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PayoutController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/wisata-affiliates/payouts', [
            'payouts' => WisataAffiliatePayout::query()->with('affiliate')->latest('id')->get(),
            'affiliates' => WisataAffiliate::query()->select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'affiliate_id' => ['required', 'integer', 'exists:wisata_affiliates,id'],
            'period_start' => ['nullable', 'date'],
            'period_end' => ['nullable', 'date'],
            'total_commission' => ['required', 'integer', 'min:0'],
            'status' => ['required', 'in:pending,approved,rejected,paid'],
            'bank_name' => ['nullable', 'string', 'max:255'],
            'bank_account_number' => ['nullable', 'string', 'max:255'],
            'bank_account_name' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $payout = WisataAffiliatePayout::create($data);

        WisataAffiliateAuditLog::create([
            'admin_id' => $request->user()?->id,
            'action' => 'payout_created',
            'subject_type' => WisataAffiliatePayout::class,
            'subject_id' => $payout->id,
            'meta' => $data,
        ]);

        return back()->with('status', 'payout-created');
    }

    public function updateStatus(Request $request, WisataAffiliatePayout $payout): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:pending,approved,rejected,paid'],
            'notes' => ['nullable', 'string'],
        ]);

        $payout->update([
            'status' => $data['status'],
            'notes' => $data['notes'] ?? $payout->notes,
        ]);

        WisataAffiliateAuditLog::create([
            'admin_id' => $request->user()?->id,
            'action' => 'payout_status_updated',
            'subject_type' => WisataAffiliatePayout::class,
            'subject_id' => $payout->id,
            'meta' => $data,
        ]);

        return back()->with('status', 'payout-status-updated');
    }
}
