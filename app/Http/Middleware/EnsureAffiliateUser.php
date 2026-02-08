<?php

namespace App\Http\Middleware;

use App\Models\WisataAffiliate;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAffiliateUser
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (! $user) {
            return redirect()->route('login');
        }

        $affiliate = WisataAffiliate::query()->where('user_id', $user->id)->first();
        if (! $affiliate) {
            return redirect()->route('affiliate.register');
        }

        return $next($request);
    }
}
