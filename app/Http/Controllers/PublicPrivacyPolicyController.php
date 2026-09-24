<?php

namespace App\Http\Controllers;

use App\Models\PrivacyPolicy;
use App\Support\HtmlSanitizer;
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

    public function refund(): Response
    {
        return Inertia::render('public/privacy-policy', [
            'policy' => $this->activePolicy(),
            'initialSection' => 'refund',
            'pageTitle' => 'Refund Policy Indotix',
            'canonicalPath' => '/refund-policy',
        ]);
    }

    private function activePolicy(): ?PrivacyPolicy
    {
        $policy = PrivacyPolicy::query()
            ->where('is_active', true)
            ->orderByDesc('effective_at')
            ->orderByDesc('id')
            ->first();

        if (! $policy) {
            return null;
        }

        $policy->content = HtmlSanitizer::clean($policy->content);
        $policy->terms_content = HtmlSanitizer::clean($policy->terms_content);
        $policy->refund_content = HtmlSanitizer::clean($policy->refund_content);

        return $policy;
    }
}
