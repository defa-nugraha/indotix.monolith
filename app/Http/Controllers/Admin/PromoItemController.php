<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PromoItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PromoItemController extends Controller
{
    public function index(): Response
    {
        $items = PromoItem::query()
            ->orderBy('sort_order')
            ->orderByDesc('id')
            ->get();

        return Inertia::render('admin/public/promo-items/index', [
            'items' => $items,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/public/promo-items/create');
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

        $path = $request->file('image')->store('promo-items', 'public');

        PromoItem::create([
            'title' => $data['title'] ?? null,
            'link_url' => $data['link_url'] ?? null,
            'sort_order' => $data['sort_order'] ?? 0,
            'is_active' => (bool) ($data['is_active'] ?? true),
            'image_path' => $path,
        ]);

        return redirect()->route('admin.public.promo-items.index')->with('status', 'promo-item-created');
    }

    public function edit(PromoItem $promoItem): Response
    {
        return Inertia::render('admin/public/promo-items/edit', [
            'promoItem' => $promoItem,
        ]);
    }

    public function update(Request $request, PromoItem $promoItem): RedirectResponse
    {
        $data = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'link_url' => ['nullable', 'string', 'max:500'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'image' => ['nullable', 'image', 'max:5120'],
        ]);

        if ($request->hasFile('image')) {
            if ($promoItem->image_path) {
                Storage::disk('public')->delete($promoItem->image_path);
            }
            $promoItem->image_path = $request->file('image')->store('promo-items', 'public');
        }

        $promoItem->fill([
            'title' => $data['title'] ?? null,
            'link_url' => $data['link_url'] ?? null,
            'sort_order' => $data['sort_order'] ?? 0,
            'is_active' => (bool) ($data['is_active'] ?? true),
        ]);
        $promoItem->save();

        return redirect()->route('admin.public.promo-items.index')->with('status', 'promo-item-updated');
    }

    public function destroy(PromoItem $promoItem): RedirectResponse
    {
        if ($promoItem->image_path) {
            Storage::disk('public')->delete($promoItem->image_path);
        }
        $promoItem->delete();

        return back()->with('status', 'promo-item-deleted');
    }
}
