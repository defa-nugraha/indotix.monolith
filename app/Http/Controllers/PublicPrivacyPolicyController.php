<?php

namespace App\Http\Controllers;

use App\Models\PrivacyPolicy;
use Inertia\Inertia;
use Inertia\Response;

class PublicPrivacyPolicyController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('public/privacy-policy', [
            'policy' => $this->activePolicy(),
            'initialSection' => 'privacy',
            'pageTitle' => 'Kebijakan Privasi Indotix',
            'canonicalPath' => '/privacy-policy',
        ]);
    }

    public function terms(): Response
    {
        return Inertia::render('public/privacy-policy', [
            'policy' => $this->activePolicy(),
            'initialSection' => 'terms',
            'pageTitle' => 'Syarat dan Ketentuan Indotix',
            'canonicalPath' => '/terms-and-conditions',
        ]);
    }

    private function activePolicy(): ?PrivacyPolicy
    {
        return PrivacyPolicy::query()
            ->where('is_active', true)
            ->orderByDesc('effective_at')
            ->orderByDesc('id')
            ->first();
    }
}
