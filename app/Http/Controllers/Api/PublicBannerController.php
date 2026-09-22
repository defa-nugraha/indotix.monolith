<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PublicBanner;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PublicBannerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $banners = PublicBanner::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderByDesc('id')
            ->get()
            ->map(fn (PublicBanner $banner) => [
                'id' => $banner->id,
                'title' => $banner->title,
                'image_url' => $banner->image_path ? Storage::url($banner->image_path) : null,
                'link_url' => $banner->link_url,
                'sort_order' => $banner->sort_order,
            ]);

        return response()->json([
            'banners' => $banners,
        ]);
    }

}
