<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PromoItem;
use App\Services\MediaCompressionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PromoItemController extends Controller
{
    private const CATEGORY_OPTIONS = [
        'wisata' => 'Wisata',
        'pengguna_baru' => 'Pengguna Baru',
        'musiman' => 'Musiman',
        'pembayaran' => 'Pembayaran',
        'partner' => 'Partner',
    ];

    public function index(): Response
    {
        $items = PromoItem::query()
            ->orderBy('sort_order')
            ->orderByDesc('id')
            ->get()
            ->map(fn (PromoItem $item) => $this->promoItemPayload($item));

        return Inertia::render('admin/public/promo-items/index', [
            'items' => $items,
            'categoryOptions' => self::CATEGORY_OPTIONS,
        ]);
    }

    public function create(): Response
    {
        $usedOrders = $this->usedHomepageSlots();
        $availableOrders = array_values(array_diff([1, 2, 3], $usedOrders));
        $nextSortOrder = $availableOrders[0] ?? 0;

        return Inertia::render('admin/public/promo-items/create', [
            'nextSortOrder' => $nextSortOrder,
            'orderFull' => empty($availableOrders),
            'homepageSlots' => $this->homepageSlots(),
            'categoryOptions' => self::CATEGORY_OPTIONS,
        ]);
    }

    public function store(Request $request, MediaCompressionService $mediaCompression): RedirectResponse
    {
        $request->merge(['is_active' => $request->boolean('is_active', true)]);

        $usedOrders = $this->usedHomepageSlots();
        $availableOrders = array_values(array_diff([1, 2, 3], $usedOrders));
        $sortOrder = $request->filled('sort_order')
            ? (int) $request->input('sort_order')
            : ($availableOrders[0] ?? 0);
        $dimensionRule = $sortOrder === 1 || $sortOrder === 2
            ? 'dimensions:width=600,height=800'
            : 'dimensions:width=1200,height=400';
        $dimensionMessage = $sortOrder === 1 || $sortOrder === 2
            ? 'Ukuran gambar promo slot homepage 1-2 harus 600 x 800 px.'
            : 'Ukuran gambar promo detail/slot homepage 3 harus 1200 x 400 px.';

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('promo_items', 'slug')],
            'category' => ['required', Rule::in(array_keys(self::CATEGORY_OPTIONS))],
            'excerpt' => ['nullable', 'string', 'max:300'],
            'description' => ['nullable', 'string'],
            'terms' => ['nullable', 'string'],
            'link_url' => ['nullable', 'string', 'max:500'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:3', Rule::notIn($usedOrders)],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_active' => ['nullable', 'boolean'],
            'image' => ['required', 'image', 'max:5120', $dimensionRule],
        ], [
            'image.dimensions' => $dimensionMessage,
            'sort_order.not_in' => 'Slot homepage sudah digunakan. Pilih slot lain atau gunakan 0 agar tidak tampil di homepage.',
        ]);

        $path = $mediaCompression->store($request->file('image'), 'promo-items', 'public');

        PromoItem::create([
            'title' => $data['title'],
            'slug' => $this->uniqueSlug($data['slug'] ?? $data['title']),
            'category' => $data['category'],
            'excerpt' => $data['excerpt'] ?? null,
            'description' => $data['description'] ?? null,
            'terms' => $data['terms'] ?? null,
            'link_url' => $data['link_url'] ?? null,
            'sort_order' => $data['sort_order'] ?? $sortOrder,
            'starts_at' => $data['starts_at'] ?? null,
            'ends_at' => $data['ends_at'] ?? null,
            'is_active' => (bool) ($data['is_active'] ?? true),
            'image_path' => $path,
        ]);

        return redirect()->route('admin.public.promo-items.index')->with('status', 'promo-item-created');
    }

    public function edit(PromoItem $promoItem): Response
    {
        return Inertia::render('admin/public/promo-items/edit', [
            'promoItem' => $this->promoItemPayload($promoItem),
            'homepageSlots' => $this->homepageSlots($promoItem),
            'categoryOptions' => self::CATEGORY_OPTIONS,
        ]);
    }

    public function update(Request $request, PromoItem $promoItem, MediaCompressionService $mediaCompression): RedirectResponse
    {
        $request->merge(['is_active' => $request->boolean('is_active', true)]);

        $usedOrders = $this->usedHomepageSlots($promoItem);
        $sortOrder = (int) $request->input('sort_order', $promoItem->sort_order ?? 1);
        $dimensionRule = $sortOrder === 1 || $sortOrder === 2
            ? 'dimensions:width=600,height=800'
            : 'dimensions:width=1200,height=400';
        $dimensionMessage = $sortOrder === 1 || $sortOrder === 2
            ? 'Ukuran gambar promo slot homepage 1-2 harus 600 x 800 px.'
            : 'Ukuran gambar promo detail/slot homepage 3 harus 1200 x 400 px.';

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('promo_items', 'slug')->ignore($promoItem->id)],
            'category' => ['required', Rule::in(array_keys(self::CATEGORY_OPTIONS))],
            'excerpt' => ['nullable', 'string', 'max:300'],
            'description' => ['nullable', 'string'],
            'terms' => ['nullable', 'string'],
            'link_url' => ['nullable', 'string', 'max:500'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:3', Rule::notIn($usedOrders)],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_active' => ['nullable', 'boolean'],
            'image' => ['nullable', 'image', 'max:5120', $dimensionRule],
        ], [
            'image.dimensions' => $dimensionMessage,
            'sort_order.not_in' => 'Slot homepage sudah digunakan. Pilih slot lain atau gunakan 0 agar tidak tampil di homepage.',
        ]);

        if ($request->hasFile('image')) {
            $previousPath = $promoItem->image_path;
            $promoItem->image_path = $mediaCompression->store($request->file('image'), 'promo-items', 'public');
            if ($previousPath) {
                Storage::disk('public')->delete($previousPath);
            }
        }

        $promoItem->fill([
            'title' => $data['title'],
            'slug' => $this->uniqueSlug($data['slug'] ?? $data['title'], $promoItem->id),
            'category' => $data['category'],
            'excerpt' => $data['excerpt'] ?? null,
            'description' => $data['description'] ?? null,
            'terms' => $data['terms'] ?? null,
            'link_url' => $data['link_url'] ?? null,
            'sort_order' => $data['sort_order'] ?? 0,
            'starts_at' => $data['starts_at'] ?? null,
            'ends_at' => $data['ends_at'] ?? null,
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

    private function uniqueSlug(string $value, ?int $ignoreId = null): string
    {
        $baseSlug = Str::slug($value) ?: 'promo-indotix';
        $slug = $baseSlug;
        $counter = 2;

        while (
            PromoItem::query()
                ->where('slug', $slug)
                ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        return $slug;
    }

    private function promoItemPayload(PromoItem $item): array
    {
        return [
            'id' => $item->id,
            'title' => $item->title,
            'slug' => $item->slug,
            'category' => $item->category,
            'category_label' => self::CATEGORY_OPTIONS[$item->category] ?? 'Promo',
            'excerpt' => $item->excerpt,
            'description' => $item->description,
            'terms' => $item->terms,
            'image_path' => $item->image_path,
            'link_url' => $item->link_url,
            'sort_order' => (int) $item->sort_order,
            'starts_at' => $item->starts_at?->toDateString(),
            'ends_at' => $item->ends_at?->toDateString(),
            'is_active' => (bool) $item->is_active,
        ];
    }

    private function usedHomepageSlots(?PromoItem $ignore = null): array
    {
        return PromoItem::query()
            ->when($ignore, fn ($query) => $query->where('id', '!=', $ignore->id))
            ->pluck('sort_order')
            ->map(fn ($value) => (int) $value)
            ->filter(fn ($value) => $value >= 1 && $value <= 3)
            ->unique()
            ->values()
            ->all();
    }

    private function homepageSlots(?PromoItem $ignore = null): array
    {
        $usedItems = PromoItem::query()
            ->when($ignore, fn ($query) => $query->where('id', '!=', $ignore->id))
            ->whereBetween('sort_order', [1, 3])
            ->orderBy('sort_order')
            ->get(['id', 'title', 'sort_order'])
            ->keyBy(fn (PromoItem $item) => (int) $item->sort_order);

        return collect([1, 2, 3])
            ->map(function (int $slot) use ($usedItems) {
                $item = $usedItems->get($slot);

                return [
                    'value' => $slot,
                    'label' => "Slot {$slot}",
                    'used' => (bool) $item,
                    'used_by' => $item?->title,
                ];
            })
            ->all();
    }
}
