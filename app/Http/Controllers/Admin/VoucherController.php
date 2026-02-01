<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Hotel;
use App\Models\Voucher;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class VoucherController extends Controller
{
    public function index(): Response
    {
        $vouchers = Voucher::query()
            ->with('hotel')
            ->latest()
            ->get()
            ->map(fn (Voucher $voucher) => [
                'id' => $voucher->id,
                'code' => $voucher->code,
                'discount_type' => $voucher->discount_type,
                'discount_value' => $voucher->discount_value,
                'min_transaction' => $voucher->min_transaction,
                'quota_total' => $voucher->quota_total,
                'quota_used' => $voucher->quota_used,
                'max_per_user_per_day' => $voucher->max_per_user_per_day,
                'starts_at' => $voucher->starts_at?->toDateString(),
                'ends_at' => $voucher->ends_at?->toDateString(),
                'hotel_id' => $voucher->hotel_id,
                'hotel_name' => $voucher->hotel?->name,
                'is_active' => $voucher->is_active,
            ]);

        return Inertia::render('admin/marketing/vouchers/index', [
            'vouchers' => $vouchers,
            'hotelOptions' => $this->hotelOptions(),
            'typeOptions' => ['percentage', 'fixed'],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateVoucher($request);
        $data['is_active'] = $request->boolean('is_active');
        $data['code'] = strtoupper($data['code']);
        Voucher::create($data);

        return back()->with('status', 'voucher-created');
    }

    public function update(Request $request, Voucher $voucher): RedirectResponse
    {
        $data = $this->validateVoucher($request, $voucher->id);
        $data['is_active'] = $request->boolean('is_active');
        $data['code'] = strtoupper($data['code']);
        $voucher->update($data);

        return back()->with('status', 'voucher-updated');
    }

    public function destroy(Voucher $voucher): RedirectResponse
    {
        $voucher->delete();

        return back()->with('status', 'voucher-deleted');
    }

    private function validateVoucher(Request $request, ?int $id = null): array
    {
        return $request->validate([
            'code' => ['required', 'string', 'max:50', Rule::unique('vouchers', 'code')->ignore($id)],
            'discount_type' => ['required', Rule::in(['percentage', 'fixed'])],
            'discount_value' => ['required', 'numeric', 'min:0'],
            'min_transaction' => ['nullable', 'numeric', 'min:0'],
            'quota_total' => ['required', 'integer', 'min:0'],
            'max_per_user_per_day' => ['nullable', 'integer', 'min:0'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'hotel_id' => ['nullable', 'integer', 'exists:hotels,id'],
            'is_active' => ['boolean'],
        ]);
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
}
