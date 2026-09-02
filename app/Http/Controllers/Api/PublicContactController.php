<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PublicContact;
use Illuminate\Http\JsonResponse;

class PublicContactController extends Controller
{
    public function show(): JsonResponse
    {
        $contact = PublicContact::query()->first();

        return response()->json([
            'contact' => [
                'company_name' => $contact?->company_name,
                'phone' => $contact?->phone,
                'email' => $contact?->email,
                'download_url' => $contact?->download_url,
                'instagram_url' => $contact?->instagram_url,
                'facebook_url' => $contact?->facebook_url,
                'twitter_url' => $contact?->twitter_url,
                'tiktok_url' => $contact?->tiktok_url,
                'youtube_url' => $contact?->youtube_url,
            ],
        ]);
    }
}
