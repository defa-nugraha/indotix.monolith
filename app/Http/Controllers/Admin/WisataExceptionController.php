<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MitraWisataOnboarding;
use App\Models\WisataBooking;
use App\Models\WisataDispute;
use App\Support\AdminDataScope;
use App\Services\WisataPaymentLifecycleService;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WisataExceptionController extends Controller
{
    public function index(Request $request): Response
    {
        $bookingQuery = WisataBooking::query()
            ->with(['destination', 'ticket', 'user:id,name,email'])
            ->whereHas('destination', fn ($builder) => AdminDataScope::applyCreatedByOrUser($builder, $request));

        if ($date = $request->string('visit_date')->toString()) {
            $bookingQuery->whereDate('visit_date', $date);
        }
        if ($destination = $request->string('destination')->toString()) {
            $bookingQuery->where('mitra_wisata_onboarding_id', $destination);
        }
        if ($status = $request->string('status')->toString()) {
            $bookingQuery->where('status', $status);
        }

        $bookings = $bookingQuery->latest('id')
            ->paginate(\App\Support\PaginationOptions::perPage())
            ->withQueryString()
            ->through(fn (WisataBooking $booking) => [
                'id' => $booking->id,
                'booking_code' => $booking->booking_code,
                'visit_date' => $booking->visit_date?->toDateString(),
                'status' => $booking->status,
                'total_price' => $booking->total_price,
                'destination' => [
                    'id' => $booking->destination?->id,
                    'destination_name' => $booking->destination?->destination_name,
                ],
                'user' => [
                    'name' => $booking->user?->name,
                    'email' => $booking->user?->email,
                ],
            ]);

        $disputes = WisataDispute::query()
            ->with(['booking', 'destination', 'ticket', 'user:id,name,email'])
            ->whereHas('destination', fn ($builder) => AdminDataScope::applyCreatedByOrUser($builder, $request))
            ->latest('id')
            ->paginate(\App\Support\PaginationOptions::perPage())
            ->withQueryString()
            ->through(fn (WisataDispute $dispute) => [
                'id' => $dispute->id,
                'subject' => $dispute->subject,
                'status' => $dispute->status,
                'booking_code' => $dispute->booking?->booking_code,
                'destination' => $dispute->destination?->destination_name,
                'ticket' => $dispute->ticket?->name,
                'user' => $dispute->user?->name,
            ]);

        $destinations = AdminDataScope::applyCreatedByOrUser(MitraWisataOnboarding::query(), $request)
            ->orderBy('destination_name')
            ->get(['id', 'destination_name'])
            ->map(fn ($item) => ['id' => $item->id, 'label' => $item->destination_name ?? 'Destinasi #' . $item->id])
            ->all();

        return Inertia::render('admin/wisata/exceptions/index', [
            'bookings' => $bookings,
            'disputes' => $disputes,
            'destinations' => $destinations,
            'filters' => [
                'visit_date' => $request->string('visit_date')->toString(),
                'destination' => $request->string('destination')->toString(),
                'status' => $request->string('status')->toString(),
            ],
        ]);
    }

    public function cancel(Request $request, WisataBooking $booking, WisataPaymentLifecycleService $payments): RedirectResponse
    {
        if ($booking->destination) {
            AdminDataScope::authorizeCreatedByOrUser($booking->destination, $request);
        }

        $data = $request->validate(['reason' => ['required', 'string', 'max:500']]);

        try {
            $payments->cancelBooking($booking, $data['reason'], (int) $request->user()->id);
        } catch (RuntimeException $exception) {
            return back()->withErrors(['booking' => $exception->getMessage()]);
        } catch (\Throwable $exception) {
            Log::warning('Admin wisata cancellation synchronization failed.', [
                'booking_id' => $booking->id,
                'admin_id' => $request->user()->id,
                'message' => $exception->getMessage(),
            ]);

            return back()->withErrors([
                'booking' => 'Pembatalan belum dapat dipastikan. Booking tidak ditandai batal dan akan direkonsiliasi.',
            ]);
        }

        return back()->with('status', 'booking-cancelled');
    }

    public function refund(Request $request, WisataBooking $booking, WisataPaymentLifecycleService $payments): RedirectResponse
    {
        if ($booking->destination) {
            AdminDataScope::authorizeCreatedByOrUser($booking->destination, $request);
        }

        $data = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
            'amount' => ['nullable', 'integer', 'min:1'],
        ]);

        try {
            $refund = $payments->requestFullRefund(
                $booking,
                $data['reason'],
                isset($data['amount']) ? (int) $data['amount'] : null,
                (int) $request->user()->id,
            );
        } catch (RuntimeException $exception) {
            return back()->withErrors(['refund' => $exception->getMessage()]);
        } catch (\Throwable $exception) {
            Log::warning('Wisata provider refund failed or is uncertain.', [
                'booking_id' => $booking->id,
                'admin_id' => $request->user()->id,
                'message' => $exception->getMessage(),
            ]);

            return back()->withErrors([
                'refund' => 'Status refund provider belum dapat dipastikan. Jangan ulang manual; sistem akan melakukan rekonsiliasi.',
            ]);
        }

        return back()->with('status', $refund->status === 'processed' ? 'booking-refunded' : 'refund-processing');
    }

    public function resolveDispute(Request $request, WisataDispute $dispute): RedirectResponse
    {
        if ($dispute->destination) {
            AdminDataScope::authorizeCreatedByOrUser($dispute->destination, $request);
        }

        $data = $request->validate([
            'status' => ['required', 'in:investigating,resolved,rejected'],
            'resolution' => ['nullable', 'string', 'max:1000'],
        ]);

        $dispute->update($data);

        return back()->with('status', 'dispute-updated');
    }
}
