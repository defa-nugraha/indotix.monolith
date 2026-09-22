<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MobilePromoBanner;
use App\Rules\MobileContentUrl;
use App\Support\MobileHomeContent;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class MobilePromoBannerController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/mobile/promos/index', ['promos' => MobilePromoBanner::query()->orderBy('sort_order')->orderByDesc('id')->get()->map(fn ($promo) => array_merge($promo->toArray(), ['image_url' => MobileHomeContent::url($promo->image_path)]))]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/mobile/promos/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request, true);
        $path = $request->file('image')->store('mobile/home/promos', 'public');
        MobilePromoBanner::create([...$data, 'image_path' => $path]);

        return to_route('admin.mobile.promos.index')->with('status', 'mobile-promo-created');
    }

    public function edit(MobilePromoBanner $promo): Response
    {
        return Inertia::render('admin/mobile/promos/edit', ['promo' => array_merge($promo->toArray(), ['image_url' => MobileHomeContent::url($promo->image_path)])]);
    }

    public function update(Request $request, MobilePromoBanner $promo): RedirectResponse
    {
        $data = $this->validated($request, false);
        $oldPath = $promo->image_path;
        $newPath = $request->file('image')?->store('mobile/home/promos', 'public');
        $promo->update([...$data, ...($newPath ? ['image_path' => $newPath] : [])]);
        if ($newPath && $oldPath !== $newPath) {
            Storage::disk('public')->delete($oldPath);
        }

        return to_route('admin.mobile.promos.index')->with('status', 'mobile-promo-updated');
    }

    public function destroy(MobilePromoBanner $promo): RedirectResponse
    {
        $path = $promo->image_path;
        $promo->delete();
        if ($path && ! MobilePromoBanner::where('image_path', $path)->exists()) {
            Storage::disk('public')->delete($path);
        }

        return back()->with('status', 'mobile-promo-deleted');
    }

    private function validated(Request $request, bool $required): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'alt_text' => ['nullable', 'string', 'max:255'],
            'target_url' => ['nullable', 'string', 'max:2048', new MobileContentUrl],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'image' => [$required ? 'required' : 'nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);
    }
}
