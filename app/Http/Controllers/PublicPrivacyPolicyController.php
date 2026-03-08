<?php

namespace App\Http\Controllers;

use App\Models\PrivacyPolicy;
use Inertia\Inertia;
use Inertia\Response;

class PublicPrivacyPolicyController extends Controller
{
    public function show(): Response
    {
        $policy = PrivacyPolicy::query()
            ->where('is_active', true)
            ->orderByDesc('effective_at')
            ->orderByDesc('id')
            ->first();

        return Inertia::render('public/privacy-policy', [
            'policy' => $policy,
        ]);
    }
}
