<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PublicBanner;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'link_url' => ['nullable', 'string', 'max:500'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'image' => ['required', 'image', 'max:5120'],
        ]);

        $path = $request->file('image')->store('public-banners', 'public');

        PublicBanner::create([
            'title' => $data['title'] ?? null,
            'link_url' => $data['link_url'] ?? null,
            'sort_order' => $data['sort_order'] ?? 0,
            'is_active' => (bool) ($data['is_active'] ?? true),
            'image_path' => $path,
        ]);

        return redirect()->route('admin.public.banners.index')->with('status', 'banner-created');
    }

    public function edit(PublicBanner $banner): Response
    {
        return Inertia::render('admin/public/banners/edit', [
            'banner' => $banner,
        ]);
    }

    public function update(Request $request, PublicBanner $banner): RedirectResponse
    {
        $data = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'link_url' => ['nullable', 'string', 'max:500'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'image' => ['nullable', 'image', 'max:5120'],
        ]);

        if ($request->hasFile('image')) {
            if ($banner->image_path) {
                Storage::disk('public')->delete($banner->image_path);
            }
            $banner->image_path = $request->file('image')->store('public-banners', 'public');
        }

        $banner->fill([
            'title' => $data['title'] ?? null,
            'link_url' => $data['link_url'] ?? null,
            'sort_order' => $data['sort_order'] ?? 0,
            'is_active' => (bool) ($data['is_active'] ?? true),
        ]);
        $banner->save();

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
