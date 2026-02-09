<?php

namespace App\Http\Controllers\Affiliate;

use App\Http\Controllers\Controller;
use App\Models\WisataAffiliateClick;
use App\Models\WisataAffiliateLink;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ReferralController extends Controller
{
    public function apply(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:32'],
        ]);

        $link = WisataAffiliateLink::query()
            ->with('affiliate')
            ->where('status', 'active')
            ->where('code', strtoupper($data['code']))
            ->first();

        if (! $link || ! $link->affiliate || $link->affiliate->status !== 'active') {
            return back()->withErrors(['code' => 'Kode afiliasi tidak valid atau nonaktif.']);
        }

        $request->session()->put('affiliate_ref', [
            'link_id' => $link->id,
            'set_at' => now()->timestamp,
        ]);

        WisataAffiliateClick::create([
            'affiliate_link_id' => $link->id,
            'user_id' => $request->user()?->id,
            'ip' => $request->ip(),
            'user_agent' => (string) $request->userAgent(),
        ]);

        return back()->withCookie(cookie(
            'affiliate_ref',
            json_encode(['link_id' => $link->id, 'set_at' => now()->timestamp]),
            $link->cookie_days * 1440
        ));
    }

    public function clear(Request $request): RedirectResponse
    {
        $request->session()->forget('affiliate_ref');

        return back()->withCookie(cookie()->forget('affiliate_ref'));
    }
}
