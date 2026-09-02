<?php

namespace App\Http\Controllers;

use App\Models\PromoItem;
use App\Models\PublicContact;
use App\Models\Voucher;
use App\Support\HomePageContent;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PublicPromoController extends Controller
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
        $vouchers = Voucher::query()
            ->with('wisataDestinations:id,destination_name,slug')
            ->where(function ($query) {
                $query->whereNull('hotel_id')->orWhere('hotel_id', 0);
            })
            ->where('is_active', true)
            ->where(function ($query) {
                $query->whereNull('starts_at')
                    ->orWhereDate('starts_at', '<=', now()->toDateString());
            })
            ->where(function ($query) {
                $query->whereNull('ends_at')
                    ->orWhereDate('ends_at', '>=', now()->toDateString());
            })
            ->where(function ($query) {
                $query->where('quota_total', 0)
                    ->orWhereColumn('quota_used', '<', 'quota_total');
            })
            ->orderByRaw("case when discount_type = 'percentage' then discount_value else 0 end desc")
            ->orderByDesc('discount_value')
            ->get()
            ->map(fn (Voucher $voucher) => [
                'id' => $voucher->id,
                'code' => $voucher->code,
                'discount_type' => $voucher->discount_type,
                'discount_value' => (int) $voucher->discount_value,
                'min_transaction' => (int) ($voucher->min_transaction ?? 0),
                'quota_total' => (int) $voucher->quota_total,
                'quota_used' => (int) $voucher->quota_used,
                'max_per_user_per_day' => (int) ($voucher->max_per_user_per_day ?? 0),
                'starts_at' => $voucher->starts_at?->toDateString(),
                'ends_at' => $voucher->ends_at?->toDateString(),
                'use_url' => route('promo.voucher.select', $voucher->code),
                'target_destinations' => $voucher->wisataDestinations
                    ->map(fn ($destination) => [
                        'id' => $destination->id,
                        'name' => $destination->destination_name,
                        'slug' => $destination->slug,
                    ])
                    ->values()
                    ->all(),
            ]);

        $promoItems = $this->activePromoItemsQuery()
            ->orderBy('sort_order')
            ->orderByDesc('id')
            ->get()
            ->map(fn (PromoItem $promo) => $this->promoItemPayload($promo));

        return Inertia::render('public/promo/index', [
            'vouchers' => $vouchers,
            'promoItems' => $promoItems,
            'categoryOptions' => self::CATEGORY_OPTIONS,
            'homeContent' => HomePageContent::publicPayload(),
            'partners' => HomePageContent::publicPartners(),
            'contact' => PublicContact::query()->first(),
        ]);
    }

    public function show(PromoItem $promoItem): Response
    {
        abort_unless($this->isPromoVisible($promoItem), HttpResponse::HTTP_NOT_FOUND);

        $relatedPromos = $this->activePromoItemsQuery()
            ->where('id', '!=', $promoItem->id)
            ->where('category', $promoItem->category)
            ->orderByDesc('id')
            ->take(3)
            ->get()
            ->map(fn (PromoItem $promo) => $this->promoItemPayload($promo));

        return Inertia::render('public/promo/show', [
            'promo' => $this->promoItemPayload($promoItem),
            'relatedPromos' => $relatedPromos,
            'categoryOptions' => self::CATEGORY_OPTIONS,
        ]);
    }

    public function selectVoucher(Voucher $voucher): RedirectResponse
    {
        abort_unless($this->isVoucherSelectable($voucher), HttpResponse::HTTP_NOT_FOUND);

        $voucher->loadMissing('wisataDestinations');
        session(['pending_voucher_code' => $voucher->code]);

        $destination = $voucher->wisataDestinations->first();
        if ($destination) {
            return redirect()
                ->route('wisata.show', [
                    'destination' => $destination->slug ?: Crypt::encryptString((string) $destination->id),
                    'promo' => $voucher->code,
                ])
                ->with('status', 'voucher-selected');
        }

        return redirect()
            ->route('wisata.search')
            ->with('status', 'voucher-selected');
    }

    private function activePromoItemsQuery()
    {
        return PromoItem::query()
            ->with('voucher')
            ->where('is_active', true)
            ->where(function ($query) {
                $query->whereNull('starts_at')
                    ->orWhereDate('starts_at', '<=', now()->toDateString());
            })
            ->where(function ($query) {
                $query->whereNull('ends_at')
                    ->orWhereDate('ends_at', '>=', now()->toDateString());
            });
    }

    private function isPromoVisible(PromoItem $promo): bool
    {
        $today = now()->toDateString();

        if (! $promo->is_active) {
            return false;
        }

        if ($promo->starts_at && $promo->starts_at->toDateString() > $today) {
            return false;
        }

        if ($promo->ends_at && $promo->ends_at->toDateString() < $today) {
            return false;
        }

        return true;
    }

    private function promoItemPayload(PromoItem $promo): array
    {
        $remainingQuota = null;
        if ($promo->voucher && (int) $promo->voucher->quota_total > 0) {
            $remainingQuota = max(0, (int) $promo->voucher->quota_total - (int) $promo->voucher->quota_used);
        }

        return [
            'id' => $promo->id,
            'title' => $promo->title,
            'slug' => $promo->slug,
            'category' => $promo->category,
            'category_label' => self::CATEGORY_OPTIONS[$promo->category] ?? 'Promo',
            'excerpt' => $promo->excerpt,
            'description' => $promo->description,
            'terms' => $promo->terms,
            'image_url' => str_starts_with($promo->image_path, 'http')
                ? $promo->image_path
                : Storage::url($promo->image_path),
            'link_url' => $promo->link_url,
            'voucher_code' => $promo->voucher?->code,
            'voucher_remaining_count' => $remainingQuota,
            'sort_order' => (int) $promo->sort_order,
            'starts_at' => $promo->starts_at?->toDateString(),
            'ends_at' => $promo->ends_at?->toDateString(),
        ];
    }

    private function isVoucherSelectable(Voucher $voucher): bool
    {
        $today = now()->toDateString();

        if (! $voucher->is_active) {
            return false;
        }

        if ($voucher->hotel_id) {
            return false;
        }

        if ($voucher->starts_at && $voucher->starts_at->toDateString() > $today) {
            return false;
        }

        if ($voucher->ends_at && $voucher->ends_at->toDateString() < $today) {
            return false;
        }

        if ((int) $voucher->quota_total > 0 && (int) $voucher->quota_used >= (int) $voucher->quota_total) {
            return false;
        }

        return true;
    }
}
