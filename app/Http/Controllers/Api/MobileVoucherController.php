<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Voucher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response as HttpResponse;

class MobileVoucherController extends Controller
{
    public function index(): JsonResponse
    {
        $vouchers = Voucher::query()
            ->with('wisataDestinations:id,destination_name,slug')
            ->where('hotel_id', 0)
            ->orWhereNull('hotel_id')
            ->get()
            ->filter(fn (Voucher $voucher) => $this->isSelectable($voucher))
            ->sortByDesc(fn (Voucher $voucher) => $this->discountRank($voucher))
            ->values()
            ->map(fn (Voucher $voucher) => $this->payload($voucher));

        return response()->json(['vouchers' => $vouchers]);
    }

    public function show(string $code): JsonResponse
    {
        $voucher = Voucher::query()
            ->with('wisataDestinations:id,destination_name,slug')
            ->whereRaw('upper(code) = ?', [strtoupper($code)])
            ->firstOrFail();

        abort_unless($this->isSelectable($voucher), HttpResponse::HTTP_NOT_FOUND);

        return response()->json(['voucher' => $this->payload($voucher)]);
    }

    private function isSelectable(Voucher $voucher): bool
    {
        $today = now()->toDateString();

        return $voucher->is_active
            && ! $voucher->hotel_id
            && (! $voucher->starts_at || $voucher->starts_at->toDateString() <= $today)
            && (! $voucher->ends_at || $voucher->ends_at->toDateString() >= $today)
            && ((int) $voucher->quota_total === 0 || (int) $voucher->quota_used < (int) $voucher->quota_total);
    }

    private function discountRank(Voucher $voucher): int
    {
        return $voucher->discount_type === 'percentage'
            ? (int) $voucher->discount_value * 1000000
            : (int) $voucher->discount_value;
    }

    private function payload(Voucher $voucher): array
    {
        return [
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
            'target_destinations' => $voucher->wisataDestinations->map(fn ($destination) => [
                'id' => $destination->id,
                'name' => $destination->destination_name,
                'slug' => $destination->slug,
            ])->values()->all(),
        ];
    }
}
