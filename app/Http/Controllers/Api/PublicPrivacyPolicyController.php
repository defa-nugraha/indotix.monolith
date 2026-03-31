<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PrivacyPolicy;
use Illuminate\Http\JsonResponse;

class PublicPrivacyPolicyController extends Controller
{
    public function show(): JsonResponse
    {
        $policy = PrivacyPolicy::query()
            ->where('is_active', true)
            ->orderByDesc('effective_at')
            ->orderByDesc('id')
            ->first();

        return response()->json([
            'policy' => $policy ? [
                'id' => $policy->id,
                'title' => $policy->title,
                'content' => $policy->content,
                'terms_content' => $policy->terms_content,
                'version' => $policy->version,
                'effective_at' => $policy->effective_at?->toDateString(),
            ] : null,
        ]);
    }
}
