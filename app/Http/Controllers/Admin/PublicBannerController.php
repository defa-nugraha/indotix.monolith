<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PublicBanner;
use App\Services\MediaCompressionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PublicBannerController extends Controller
{
    public function index(): Response
    {
        $banners = PublicBanner::query()
            ->orderBy('sort_order')
            ->orderByDesc('id')
            ->get();

        return Inertia::render('admin/public/banners/index', [
            'banners' => $banners,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/public/banners/create');
    }

    public function store(Request $request, MediaCompressionService $mediaCompression): RedirectResponse
    {
        $request->merge(['is_active' => $request->boolean('is_active', true)]);

        $data = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'link_url' => ['nullable', 'string', 'max:500'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'image' => ['required', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120', 'dimensions:width=1200,height=450'],
        ], [
            'image.dimensions' => 'Ukuran banner harus 1200 x 450 px.',
        ]);

        $path = $mediaCompression->store($request->file('image'), 'public-banners', 'public');
        $isActive = (bool) ($data['is_active'] ?? true);

        try {
            DB::transaction(function () use ($data, $isActive, $path) {
                if ($isActive) {
                    PublicBanner::query()->where('is_active', true)->update(['is_active' => false]);
                }

                PublicBanner::create([
                    'title' => $data['title'] ?? null,
                    'link_url' => $data['link_url'] ?? null,
                    'sort_order' => $data['sort_order'] ?? 0,
                    'is_active' => $isActive,
                    'image_path' => $path,
                ]);
            });
        } catch (\Throwable $exception) {
            Storage::disk('public')->delete($path);

            throw $exception;
        }

        return redirect()->route('admin.public.banners.index')->with('status', 'banner-created');
    }

    public function edit(PublicBanner $banner): Response
    {
        return Inertia::render('admin/public/banners/edit', [
            'banner' => $banner,
        ]);
    }

    public function update(Request $request, PublicBanner $banner, MediaCompressionService $mediaCompression): RedirectResponse
    {
        $request->merge(['is_active' => $request->boolean('is_active', true)]);

        $data = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'link_url' => ['nullable', 'string', 'max:500'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'image' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120', 'dimensions:width=1200,height=450'],
        ], [
            'image.dimensions' => 'Ukuran banner harus 1200 x 450 px.',
        ]);

        $oldImagePath = $banner->image_path;
        $newImagePath = null;
        $isActive = (bool) ($data['is_active'] ?? true);

        if ($request->hasFile('image')) {
            $newImagePath = $mediaCompression->store($request->file('image'), 'public-banners', 'public');
            $banner->image_path = $newImagePath;
        }

        try {
            DB::transaction(function () use ($banner, $data, $isActive) {
                if ($isActive) {
                    PublicBanner::query()
                        ->where('id', '!=', $banner->id)
                        ->where('is_active', true)
                        ->update(['is_active' => false]);
                }

                $banner->fill([
                    'title' => $data['title'] ?? null,
                    'link_url' => $data['link_url'] ?? null,
                    'sort_order' => $data['sort_order'] ?? 0,
                    'is_active' => $isActive,
                ]);
                $banner->save();
            });
        } catch (\Throwable $exception) {
            if ($newImagePath) {
                Storage::disk('public')->delete($newImagePath);
            }

            throw $exception;
        }

        if ($newImagePath && $oldImagePath && $oldImagePath !== $newImagePath) {
            Storage::disk('public')->delete($oldImagePath);
        }

        return redirect()->route('admin.public.banners.index')->with('status', 'banner-updated');
    }

    public function destroy(PublicBanner $banner): RedirectResponse
    {
        if ($banner->image_path) {
            Storage::disk('public')->delete($banner->image_path);
        }
        $banner->delete();

        return back()->with('status', 'banner-deleted');
    }
}
