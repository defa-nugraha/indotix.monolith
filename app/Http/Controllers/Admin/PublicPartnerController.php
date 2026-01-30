<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PublicPartner;
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

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'link_url' => ['nullable', 'string', 'max:500'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'image' => ['required', 'image', 'max:5120'],
        ]);

        $path = $request->file('image')->store('public-partners', 'public');

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

    public function update(Request $request, PublicPartner $partner): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'link_url' => ['nullable', 'string', 'max:500'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'image' => ['nullable', 'image', 'max:5120'],
        ]);

        if ($request->hasFile('image')) {
            if ($partner->image_path) {
                Storage::disk('public')->delete($partner->image_path);
            }
            $partner->image_path = $request->file('image')->store('public-partners', 'public');
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
