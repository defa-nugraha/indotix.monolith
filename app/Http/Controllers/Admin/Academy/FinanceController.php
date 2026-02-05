<?php

namespace App\Http\Controllers\Admin\Academy;

use App\Http\Controllers\Controller;
use App\Models\AcademyBooking;
use App\Models\AcademyRefund;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FinanceController extends Controller
{
    public function index(Request $request): Response
    {
        $paid = AcademyBooking::query()->whereIn('status', ['paid', 'completed'])->get();
        $gross = $paid->sum('total_price');
        $refunds = AcademyRefund::query()->latest('id')->get();

        return Inertia::render('admin/academy/finance/index', [
            'summary' => [
                'gross' => $gross,
                'paid_count' => $paid->count(),
                'refund_total' => $refunds->sum('amount'),
            ],
            'refunds' => $refunds,
        ]);
    }

    public function refund(Request $request, AcademyBooking $booking): RedirectResponse
    {
        $data = $request->validate([
            'amount' => ['required', 'integer', 'min:0'],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        AcademyRefund::create([
            'academy_booking_id' => $booking->id,
            'admin_id' => $request->user()->id,
            'amount' => $data['amount'],
            'reason' => $data['reason'] ?? null,
            'status' => 'approved',
        ]);

        $booking->update(['status' => 'cancelled']);

        return back()->with('status', 'refund-created');
    }
}
