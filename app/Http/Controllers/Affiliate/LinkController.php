<?php

namespace App\Http\Controllers\Affiliate;

use App\Http\Controllers\Controller;
use App\Models\MitraWisataOnboarding;
use App\Models\WisataAffiliate;
use App\Models\WisataAffiliateLink;
use App\Models\WisataAffiliateSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class LinkController extends Controller
{
    public function index(Request $request): Response
    {
        $affiliate = WisataAffiliate::query()
            ->with('links')
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $link = $affiliate->links->sortByDesc('id')->first();
        $destinationId = $affiliate->wisata_id;
        $destination = $destinationId
            ? MitraWisataOnboarding::query()->publiclyVisible()->select('id', 'slug')->find($destinationId)
            : null;

        return Inertia::render('affiliate/links', [
            'affiliate' => [
                'id' => $affiliate->id,
                'status' => $affiliate->status,
            ],
            'link' => $link ? [
                'id' => $link->id,
                'code' => $link->code,
                'token' => $link->token,
                'landing_url' => $link->landing_url,
                'status' => $link->status,
                'attribution_model' => $link->attribution_model,
                'cookie_days' => $link->cookie_days,
            ] : null,
            'destination' => $destination ? [
                'slug' => $destination->slug,
                'encrypted_id' => Crypt::encryptString((string) $destination->id),
            ] : null,
            'app_url' => config('app.url') ?: $request->getSchemeAndHttpHost(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $affiliate = WisataAffiliate::query()
            ->with('links')
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if ($affiliate->links->isNotEmpty()) {
            return back()->with('status', 'link-exists');
        }

        $setting = WisataAffiliateSetting::query()->first();

        WisataAffiliateLink::create([
            'affiliate_id' => $affiliate->id,
            'code' => strtoupper(Str::random(6)),
            'token' => Str::random(32),
            'landing_url' => null,
            'status' => 'active',
            'attribution_model' => $setting?->attribution_model ?? 'last_click',
            'cookie_days' => $setting?->cookie_days ?? 7,
        ]);

        return back()->with('status', 'link-created');
    }
}
