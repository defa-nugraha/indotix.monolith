<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PromoVideo;
use App\Services\MediaCompressionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PromoVideoController extends Controller
{
    public function index(): Response
    {
        $videos = PromoVideo::query()->orderByDesc('id')->get();

        return Inertia::render('admin/public/promo-videos/index', [
            'videos' => $videos,
        ]);
    }

    public function create(): Response
    {
        $existing = PromoVideo::query()->first();
        if ($existing) {
            return redirect()->route('admin.public.promo-videos.edit', $existing);
        }

        return Inertia::render('admin/public/promo-videos/create');
    }

    public function store(Request $request, MediaCompressionService $mediaCompression): RedirectResponse
    {
        if (PromoVideo::query()->exists()) {
            return redirect()
                ->route('admin.public.promo-videos.index')
                ->with('error', 'promo-video-exists');
        }

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'cta_label' => ['nullable', 'string', 'max:255'],
            'cta_url' => ['nullable', 'string', 'max:500'],
            'is_active' => ['nullable', 'boolean'],
            'video' => ['required', 'file', 'mimetypes:video/mp4,video/webm,video/ogg'],
            'secondary_video' => ['required', 'file', 'mimetypes:video/mp4,video/webm,video/ogg'],
        ]);

        $path = $mediaCompression->store($request->file('video'), 'promo-videos', 'public');
        $secondaryPath = $mediaCompression->store($request->file('secondary_video'), 'promo-videos', 'public');

        PromoVideo::create([
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'cta_label' => $data['cta_label'] ?? null,
            'cta_url' => $data['cta_url'] ?? null,
            'is_active' => (bool) ($data['is_active'] ?? true),
            'image_path' => $path,
            'secondary_video_path' => $secondaryPath,
        ]);

        return redirect()->route('admin.public.promo-videos.index')->with('status', 'promo-video-created');
    }

    public function edit(PromoVideo $promoVideo): Response
    {
        return Inertia::render('admin/public/promo-videos/edit', [
            'promoVideo' => $promoVideo,
        ]);
    }

    public function update(Request $request, PromoVideo $promoVideo, MediaCompressionService $mediaCompression): RedirectResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'cta_label' => ['nullable', 'string', 'max:255'],
            'cta_url' => ['nullable', 'string', 'max:500'],
            'is_active' => ['nullable', 'boolean'],
            'video' => ['nullable', 'file', 'mimetypes:video/mp4,video/webm,video/ogg'],
            'secondary_video' => ['nullable', 'file', 'mimetypes:video/mp4,video/webm,video/ogg'],
        ]);

        if ($request->hasFile('video')) {
            if ($promoVideo->image_path) {
                Storage::disk('public')->delete($promoVideo->image_path);
            }
            $promoVideo->image_path = $mediaCompression->store($request->file('video'), 'promo-videos', 'public');
        }
        if ($request->hasFile('secondary_video')) {
            if ($promoVideo->secondary_video_path) {
                Storage::disk('public')->delete($promoVideo->secondary_video_path);
            }
            $promoVideo->secondary_video_path = $mediaCompression->store($request->file('secondary_video'), 'promo-videos', 'public');
        }

        $promoVideo->fill([
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'cta_label' => $data['cta_label'] ?? null,
            'cta_url' => $data['cta_url'] ?? null,
            'is_active' => (bool) ($data['is_active'] ?? true),
        ]);
        $promoVideo->save();

        return redirect()->route('admin.public.promo-videos.index')->with('status', 'promo-video-updated');
    }

    public function destroy(PromoVideo $promoVideo): RedirectResponse
    {
        if ($promoVideo->image_path) {
            Storage::disk('public')->delete($promoVideo->image_path);
        }
        if ($promoVideo->secondary_video_path) {
            Storage::disk('public')->delete($promoVideo->secondary_video_path);
        }
        $promoVideo->delete();

        return back()->with('status', 'promo-video-deleted');
    }
}
