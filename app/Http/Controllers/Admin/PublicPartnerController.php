<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PublicPartner;
use App\Services\MediaCompressionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PublicPartnerController extends Controller
{
    public function index(): Response
    {
        $partners = PublicPartner::query()
            ->whereNotNull('image_path')
            ->where('image_path', '!=', '')
            ->orderBy('sort_order')
            ->orderByDesc('id')
            ->get();

        return Inertia::render('admin/public/partners/index', [
            'partners' => $partners,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/public/partners/create');
    }

    public function store(Request $request, MediaCompressionService $mediaCompression): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'link_url' => ['nullable', 'string', 'max:500'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $path = $mediaCompression->store($request->file('image'), 'public-partners', 'public');
        if (! is_string($path) || trim($path) === '') {
            return back()
                ->withErrors(['image' => 'Logo gagal disimpan. Silakan unggah ulang.'])
                ->withInput();
        }

        PublicPartner::create([
            'name' => $data['name'] ?? null,
            'link_url' => $data['link_url'] ?? null,
            'sort_order' => $data['sort_order'] ?? 0,
            'is_active' => (bool) ($data['is_active'] ?? true),
            'image_path' => $path,
        ]);

        return redirect()->route('admin.public.partners.index')->with('status', 'partner-created');
    }

    public function edit(PublicPartner $partner): Response
    {
        return Inertia::render('admin/public/partners/edit', [
            'partner' => $partner,
        ]);
    }

    public function update(Request $request, PublicPartner $partner, MediaCompressionService $mediaCompression): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'link_url' => ['nullable', 'string', 'max:500'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        if ($request->hasFile('image')) {
            if ($partner->image_path) {
                Storage::disk('public')->delete($partner->image_path);
            }
            $partner->image_path = $mediaCompression->store($request->file('image'), 'public-partners', 'public');
            if (! is_string($partner->image_path) || trim($partner->image_path) === '') {
                return back()
                    ->withErrors(['image' => 'Logo gagal disimpan. Silakan unggah ulang.'])
                    ->withInput();
            }
        }

        $partner->fill([
            'name' => $data['name'] ?? null,
            'link_url' => $data['link_url'] ?? null,
            'sort_order' => $data['sort_order'] ?? 0,
            'is_active' => (bool) ($data['is_active'] ?? true),
        ]);
        $partner->save();

        return redirect()->route('admin.public.partners.index')->with('status', 'partner-updated');
    }

    public function destroy(PublicPartner $partner): RedirectResponse
    {
        if ($partner->image_path) {
            Storage::disk('public')->delete($partner->image_path);
        }
        $partner->delete();

        return back()->with('status', 'partner-deleted');
    }
}
