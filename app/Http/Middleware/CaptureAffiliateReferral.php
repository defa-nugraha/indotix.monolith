<?php

namespace App\Http\Middleware;

use App\Models\WisataAffiliateClick;
use App\Models\WisataAffiliateLink;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CaptureAffiliateReferral
{
    public function handle(Request $request, Closure $next): Response
    {
        $ref = (string) $request->query('ref', '');
        $link = null;

        if ($ref !== '') {
            $link = WisataAffiliateLink::query()
                ->where('status', 'active')
                ->where(function ($query) use ($ref) {
                    $query->where('token', $ref)->orWhere('code', strtoupper($ref));
                })
                ->first();
        }

        $shouldStore = false;
        if ($link) {
            $existing = $request->session()->get('affiliate_ref');
            if (! $existing || $link->attribution_model === 'last_click') {
                $payload = [
                    'link_id' => $link->id,
                    'set_at' => now()->timestamp,
                ];
                $request->session()->put('affiliate_ref', $payload);
                $shouldStore = true;
            }

            WisataAffiliateClick::create([
                'affiliate_link_id' => $link->id,
                'user_id' => $request->user()?->id,
                'ip' => $request->ip(),
                'user_agent' => (string) $request->userAgent(),
            ]);
        }

        $response = $next($request);

        if ($link && $shouldStore) {
            $response->withCookie(cookie(
                'affiliate_ref',
                json_encode(['link_id' => $link->id, 'set_at' => now()->timestamp]),
                $link->cookie_days * 1440
            ));
        }

        return $response;
    }
}
