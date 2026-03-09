<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PromoItem;
use App\Services\MediaCompressionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
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
        $usedOrders = PromoItem::query()
            ->pluck('sort_order')
            ->map(fn ($value) => (int) $value)
            ->filter(fn ($value) => $value >= 1 && $value <= 3)
            ->unique()
            ->values()
            ->all();
        $availableOrders = array_values(array_diff([1, 2, 3], $usedOrders));
        $nextSortOrder = $availableOrders[0] ?? 1;

        return Inertia::render('admin/public/promo-items/create', [
            'nextSortOrder' => $nextSortOrder,
            'orderFull' => empty($availableOrders),
        ]);
    }

    public function store(Request $request, MediaCompressionService $mediaCompression): RedirectResponse
    {
        $activeCount = PromoItem::query()->where('is_active', true)->count();
        $isActive = (bool) $request->boolean('is_active', true);
        if ($isActive && $activeCount >= 3) {
            throw ValidationException::withMessages([
                'is_active' => 'Maksimal 3 promo aktif. Nonaktifkan salah satu promo terlebih dahulu.',
            ]);
        }

        $usedOrders = PromoItem::query()
            ->pluck('sort_order')
            ->map(fn ($value) => (int) $value)
            ->filter(fn ($value) => $value >= 1 && $value <= 3)
            ->unique()
            ->values()
            ->all();
        $availableOrders = array_values(array_diff([1, 2, 3], $usedOrders));
        if (empty($availableOrders)) {
            throw ValidationException::withMessages([
                'sort_order' => 'Semua urutan promo (1-3) sudah terpakai. Hapus promo atau ubah urutan terlebih dahulu.',
            ]);
        }
        $sortOrder = $request->filled('sort_order')
            ? (int) $request->input('sort_order')
            : $availableOrders[0];
        $dimensionRule = $sortOrder >= 3 ? 'dimensions:width=1200,height=400' : 'dimensions:width=600,height=800';
        $dimensionMessage = $sortOrder >= 3
            ? 'Ukuran gambar promo urutan 3 harus 1200 x 400 px.'
            : 'Ukuran gambar promo urutan 1-2 harus 600 x 800 px.';

        $data = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'link_url' => ['nullable', 'string', 'max:500'],
            'sort_order' => ['nullable', 'integer', 'min:1', 'max:3', Rule::notIn($usedOrders)],
            'is_active' => ['nullable', 'boolean'],
            'image' => ['required', 'image', $dimensionRule],
        ], [
            'image.dimensions' => $dimensionMessage,
            'sort_order.not_in' => 'Urutan promo sudah digunakan. Pilih urutan lain.',
        ]);

        $path = $mediaCompression->store($request->file('image'), 'promo-items', 'public');

        PromoItem::create([
            'title' => $data['title'] ?? null,
            'link_url' => $data['link_url'] ?? null,
            'sort_order' => $data['sort_order'] ?? $sortOrder,
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

    public function update(Request $request, PromoItem $promoItem, MediaCompressionService $mediaCompression): RedirectResponse
    {
        $activeCount = PromoItem::query()
            ->where('is_active', true)
            ->where('id', '!=', $promoItem->id)
            ->count();
        $isActive = (bool) $request->boolean('is_active', $promoItem->is_active);
        if ($isActive && $activeCount >= 3) {
            throw ValidationException::withMessages([
                'is_active' => 'Maksimal 3 promo aktif. Nonaktifkan salah satu promo terlebih dahulu.',
            ]);
        }

        $usedOrders = PromoItem::query()
            ->where('id', '!=', $promoItem->id)
            ->pluck('sort_order')
            ->map(fn ($value) => (int) $value)
            ->filter(fn ($value) => $value >= 1 && $value <= 3)
            ->unique()
            ->values()
            ->all();
        $sortOrder = (int) $request->input('sort_order', $promoItem->sort_order ?? 1);
        $dimensionRule = $sortOrder >= 3 ? 'dimensions:width=1200,height=400' : 'dimensions:width=600,height=800';
        $dimensionMessage = $sortOrder >= 3
            ? 'Ukuran gambar promo urutan 3 harus 1200 x 400 px.'
            : 'Ukuran gambar promo urutan 1-2 harus 600 x 800 px.';

        $data = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'link_url' => ['nullable', 'string', 'max:500'],
            'sort_order' => ['nullable', 'integer', 'min:1', 'max:3', Rule::notIn($usedOrders)],
            'is_active' => ['nullable', 'boolean'],
            'image' => ['nullable', 'image', $dimensionRule],
        ], [
            'image.dimensions' => $dimensionMessage,
            'sort_order.not_in' => 'Urutan promo sudah digunakan. Pilih urutan lain.',
        ]);

        if ($request->hasFile('image')) {
            if ($promoItem->image_path) {
                Storage::disk('public')->delete($promoItem->image_path);
            }
            $promoItem->image_path = $mediaCompression->store($request->file('image'), 'promo-items', 'public');
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
