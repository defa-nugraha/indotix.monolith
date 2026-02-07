<?php

namespace App\Http\Controllers\Admin\WisataAffiliate;

use App\Http\Controllers\Controller;
use App\Models\WisataAffiliate;
use App\Models\WisataAffiliateLink;
use App\Models\WisataAffiliateAuditLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class LinkController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/wisata-affiliates/links', [
            'links' => WisataAffiliateLink::query()->with('affiliate')->latest('id')->get(),
            'affiliates' => WisataAffiliate::query()->select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'affiliate_id' => ['required', 'integer', 'exists:wisata_affiliates,id'],
            'landing_url' => ['nullable', 'string', 'max:255'],
            'attribution_model' => ['required', 'in:last_click,first_click'],
            'cookie_days' => ['required', 'integer', 'min:1', 'max:365'],
        ]);

        $link = WisataAffiliateLink::create([
            ...$data,
            'code' => strtoupper(Str::random(6)),
            'token' => Str::random(32),
            'status' => 'active',
        ]);

        WisataAffiliateAuditLog::create([
            'admin_id' => $request->user()?->id,
            'action' => 'link_created',
            'subject_type' => WisataAffiliateLink::class,
            'subject_id' => $link->id,
            'meta' => $data,
        ]);

        return back()->with('status', 'link-created');
    }

    public function updateStatus(Request $request, WisataAffiliateLink $link): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:active,disabled'],
        ]);

        $link->update($data);

        WisataAffiliateAuditLog::create([
            'admin_id' => $request->user()?->id,
            'action' => 'link_status_updated',
            'subject_type' => WisataAffiliateLink::class,
            'subject_id' => $link->id,
            'meta' => $data,
        ]);

        return back()->with('status', 'link-status-updated');
    }

    public function regenerateToken(Request $request, WisataAffiliateLink $link): RedirectResponse
    {
        $link->update([
            'token' => Str::random(32),
        ]);

        WisataAffiliateAuditLog::create([
            'admin_id' => $request->user()?->id,
            'action' => 'link_token_regenerated',
            'subject_type' => WisataAffiliateLink::class,
            'subject_id' => $link->id,
            'meta' => ['code' => $link->code],
        ]);

        return back()->with('status', 'link-token-updated');
    }
}
