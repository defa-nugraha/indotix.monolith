<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PublicPartOfLogo;
use App\Models\Voucher;
use App\Support\HomePageContent;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeContentController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('admin/public/home/edit', [
            'content' => HomePageContent::formPayload(),
            'partOfLogos' => $this->partOfLogos(),
            'voucherOptions' => $this->voucherOptions(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate(HomePageContent::validationRules());

        HomePageContent::persist($data, $request->user()?->id);

        return back()->with('status', 'home-content-updated');
    }

    private function voucherOptions(): array
    {
        return Voucher::query()
            ->where(function ($query) {
                $query->whereNull('hotel_id')->orWhere('hotel_id', 0);
            })
            ->orderByDesc('is_active')
            ->orderBy('code')
            ->get()
            ->map(function (Voucher $voucher) {
                $remaining = null;
                if ((int) $voucher->quota_total > 0) {
                    $remaining = max(0, (int) $voucher->quota_total - (int) $voucher->quota_used);
                }

                return [
                    'id' => $voucher->id,
                    'code' => $voucher->code,
                    'discount_type' => $voucher->discount_type,
                    'discount_value' => (int) $voucher->discount_value,
                    'min_transaction' => (int) ($voucher->min_transaction ?? 0),
                    'quota_total' => (int) $voucher->quota_total,
                    'quota_used' => (int) $voucher->quota_used,
                    'remaining_quota' => $remaining,
                    'starts_at' => $voucher->starts_at?->toDateString(),
                    'ends_at' => $voucher->ends_at?->toDateString(),
                    'is_active' => (bool) $voucher->is_active,
                    'select_url' => route('promo.voucher.select', ['voucher' => $voucher->code], false),
                ];
            })
            ->all();
    }

    private function partOfLogos(): array
    {
        return PublicPartOfLogo::query()
            ->orderBy('sort_order')
            ->orderByDesc('id')
            ->get()
            ->map(fn (PublicPartOfLogo $logo) => [
                'id' => $logo->id,
                'name' => $logo->name,
                'link_url' => $logo->link_url,
                'image_path' => $logo->image_path,
                'image_url' => $logo->image_path ? asset('storage/'.$logo->image_path) : null,
                'sort_order' => $logo->sort_order,
                'is_active' => (bool) $logo->is_active,
            ])
            ->all();
    }
}
