<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PublicPartOfLogo;
use App\Services\MediaCompressionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PublicPartOfLogoController extends Controller
{
    public function store(Request $request, MediaCompressionService $mediaCompression): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:80'],
            'link_url' => ['nullable', 'string', 'url:http,https', 'max:2048'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        PublicPartOfLogo::query()->create([
            'name' => $data['name'] ?? null,
            'link_url' => $data['link_url'] ?? null,
            'sort_order' => $data['sort_order'] ?? 0,
            'is_active' => (bool) ($data['is_active'] ?? true),
            'image_path' => $mediaCompression->store($request->file('image'), 'public-part-of-logos', 'public'),
        ]);

        return back()->with('status', 'part-of-logo-created');
    }

    public function update(Request $request, PublicPartOfLogo $logo, MediaCompressionService $mediaCompression): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:80'],
            'link_url' => ['nullable', 'string', 'url:http,https', 'max:2048'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        if ($request->hasFile('image')) {
            Storage::disk('public')->delete($logo->image_path);
            $logo->image_path = $mediaCompression->store($request->file('image'), 'public-part-of-logos', 'public');
        }

        $logo->fill([
            'name' => $data['name'] ?? null,
            'sort_order' => $data['sort_order'] ?? 0,
            'is_active' => (bool) ($data['is_active'] ?? true),
        ]);
        if (array_key_exists('link_url', $data)) {
            $logo->link_url = $data['link_url'];
        }
        $logo->save();

        return back()->with('status', 'part-of-logo-updated');
    }

    public function destroy(PublicPartOfLogo $logo): RedirectResponse
    {
        Storage::disk('public')->delete($logo->image_path);
        $logo->delete();

        return back()->with('status', 'part-of-logo-deleted');
    }
}
