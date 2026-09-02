<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Hotel;
use App\Models\MitraWisataOnboarding;
use App\Models\Voucher;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class VoucherController extends Controller
{
    public function index(Request $request): Response
    {
        $isWisataContext = $this->isWisataContext($request);
        $vouchers = Voucher::query()
            ->with(['hotel', 'wisataDestinations:id,destination_name,slug'])
            ->when($isWisataContext, fn ($query) => $query->where(function ($query) {
                $query->whereNull('hotel_id')->orWhere('hotel_id', 0);
            }))
            ->latest()
            ->get()
            ->map(fn (Voucher $voucher) => array_merge([
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
                'hotel_id' => $voucher->hotel_id,
                'hotel_name' => $voucher->hotel?->name,
                'wisata_destination_ids' => $voucher->wisataDestinations
                    ->pluck('id')
                    ->map(fn ($id) => (int) $id)
                    ->values()
                    ->all(),
                'wisata_destination_names' => $voucher->wisataDestinations
                    ->pluck('destination_name')
                    ->filter()
                    ->values()
                    ->all(),
                'is_active' => $voucher->is_active,
            ], [
                'remaining_quota' => (int) $voucher->quota_total > 0
                    ? max(0, (int) $voucher->quota_total - (int) $voucher->quota_used)
                    : null,
            ]));

        return Inertia::render('admin/marketing/vouchers/index', [
            'vouchers' => $vouchers,
            'hotelOptions' => $isWisataContext ? [] : $this->hotelOptions(),
            'wisataDestinationOptions' => $isWisataContext ? $this->wisataDestinationOptions() : [],
            'typeOptions' => ['percentage', 'fixed'],
            'routeBase' => $isWisataContext ? '/admin/wisata/vouchers' : '/admin/marketing/vouchers',
            'showHotelScope' => ! $isWisataContext,
            'pageTitle' => $isWisataContext ? 'Voucher Wisata' : 'Voucher',
            'pageEyebrow' => $isWisataContext ? 'Wisata' : 'Promo & Voucher',
            'pageDescription' => $isWisataContext
                ? 'Atur kode voucher wisata, nominal diskon, kuota, limit penggunaan, dan periode berlaku.'
                : 'Atur kode promo, diskon, kuota, dan periode berlaku.',
            'breadcrumbs' => $isWisataContext
                ? [
                    ['title' => 'Wisata', 'href' => '/admin/wisata/destinations'],
                    ['title' => 'Voucher', 'href' => '/admin/wisata/vouchers'],
                ]
                : [
                    ['title' => 'Promo & Voucher', 'href' => '/admin/marketing/vouchers'],
                    ['title' => 'Voucher', 'href' => '/admin/marketing/vouchers'],
                ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $isWisataContext = $this->isWisataContext($request);
        $data = $this->validateVoucher($request, null, $isWisataContext);
        $data['is_active'] = $request->boolean('is_active');
        $data['code'] = strtoupper($data['code']);
        $data['hotel_id'] = $isWisataContext ? null : ($data['hotel_id'] ?? null);
        $destinationIds = $isWisataContext ? $this->destinationIdsFromData($data) : [];
        unset($data['destination_scope'], $data['wisata_destination_ids']);

        $voucher = Voucher::create($data);
        if ($isWisataContext) {
            $voucher->wisataDestinations()->sync($destinationIds);
        }

        return back()->with('status', 'voucher-created');
    }

    public function update(Request $request, Voucher $voucher): RedirectResponse
    {
        $isWisataContext = $this->isWisataContext($request);
        abort_if($isWisataContext && $voucher->hotel_id, 404);

        $data = $this->validateVoucher($request, $voucher->id, $isWisataContext);
        $data['is_active'] = $request->boolean('is_active');
        $data['code'] = strtoupper($data['code']);
        $data['hotel_id'] = $isWisataContext ? null : ($data['hotel_id'] ?? null);
        $destinationIds = $isWisataContext ? $this->destinationIdsFromData($data) : [];
        unset($data['destination_scope'], $data['wisata_destination_ids']);

        $voucher->update($data);
        if ($isWisataContext) {
            $voucher->wisataDestinations()->sync($destinationIds);
        }

        return back()->with('status', 'voucher-updated');
    }

    public function destroy(Request $request, Voucher $voucher): RedirectResponse
    {
        abort_if($this->isWisataContext($request) && $voucher->hotel_id, 404);

        $voucher->delete();

        return back()->with('status', 'voucher-deleted');
    }

    private function validateVoucher(Request $request, ?int $id = null, bool $isWisataContext = false): array
    {
        $rules = [
            'code' => ['required', 'string', 'max:50', 'regex:/^[A-Za-z0-9_-]+$/', Rule::unique('vouchers', 'code')->ignore($id)],
            'discount_type' => ['required', Rule::in(['percentage', 'fixed'])],
            'discount_value' => ['required', 'numeric', 'min:0'],
            'min_transaction' => ['nullable', 'numeric', 'min:0'],
            'quota_total' => ['required', 'integer', 'min:0'],
            'max_per_user_per_day' => ['nullable', 'integer', 'min:0'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'hotel_id' => $isWisataContext
                ? ['nullable']
                : ['nullable', 'integer', 'exists:hotels,id'],
            'destination_scope' => $isWisataContext
                ? ['nullable', Rule::in(['all', 'selected'])]
                : ['nullable'],
            'wisata_destination_ids' => $isWisataContext
                ? ['required_if:destination_scope,selected', 'array', 'min:1']
                : ['nullable'],
            'wisata_destination_ids.*' => $isWisataContext
                ? ['integer', 'exists:mitra_wisata_onboardings,id']
                : ['nullable'],
            'is_active' => ['boolean'],
        ];

        if ($request->input('discount_type') === 'percentage') {
            $rules['discount_value'][] = 'max:100';
        }

        return $request->validate($rules);
    }

    private function hotelOptions(): array
    {
        return Hotel::query()
            ->select('id', 'name')
            ->orderBy('name')
            ->get()
            ->map(fn (Hotel $hotel) => [
                'id' => $hotel->id,
                'label' => $hotel->name,
            ])
            ->all();
    }

    private function wisataDestinationOptions(): array
    {
        return MitraWisataOnboarding::query()
            ->select('id', 'destination_name', 'city_code', 'verification_status', 'is_live')
            ->orderBy('destination_name')
            ->get()
            ->map(fn (MitraWisataOnboarding $destination) => [
                'id' => $destination->id,
                'label' => $destination->destination_name ?: "Wisata #{$destination->id}",
                'status' => $destination->verification_status,
                'is_live' => (bool) $destination->is_live,
            ])
            ->all();
    }

    private function destinationIdsFromData(array $data): array
    {
        if (($data['destination_scope'] ?? 'all') !== 'selected') {
            return [];
        }

        return collect($data['wisata_destination_ids'] ?? [])
            ->map(fn ($id) => (int) $id)
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    private function isWisataContext(Request $request): bool
    {
        return $request->routeIs('admin.wisata.vouchers.*')
            || $request->is('admin/wisata/vouchers*');
    }
}
