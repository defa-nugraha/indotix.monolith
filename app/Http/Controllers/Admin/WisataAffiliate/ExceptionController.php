<?php

namespace App\Http\Controllers\Admin\WisataAffiliate;

use App\Http\Controllers\Controller;
use App\Models\WisataAffiliate;
use App\Models\WisataAffiliateAuditLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExceptionController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/wisata-affiliates/exceptions', [
            'affiliates' => WisataAffiliate::query()->select('id', 'name', 'status')->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'affiliate_id' => ['required', 'integer', 'exists:wisata_affiliates,id'],
            'action' => ['required', 'in:suspend,terminate,hold_payout,release_payout'],
            'reason' => ['required', 'string'],
        ]);

        $affiliate = WisataAffiliate::query()->findOrFail($data['affiliate_id']);

        if (in_array($data['action'], ['suspend', 'terminate'], true)) {
            $affiliate->update([
                'status' => $data['action'] === 'suspend' ? 'suspended' : 'terminated',
                'notes' => $data['reason'],
            ]);
        }

        WisataAffiliateAuditLog::create([
            'admin_id' => $request->user()?->id,
            'action' => 'affiliate_exception',
            'subject_type' => WisataAffiliate::class,
            'subject_id' => $affiliate->id,
            'meta' => $data,
        ]);

        return back()->with('status', 'exception-recorded');
    }
}
