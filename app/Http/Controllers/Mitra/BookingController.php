<?php

namespace App\Http\Controllers\Mitra;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\BookingAuditLog;
use App\Models\Hotel;
use App\Services\BookingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BookingController extends Controller
{
    private const STATUSES = [
        'pending_payment',
        'paid',
        'cancelled',
        'expired',
        'completed',
        'no_show',
    ];

    private const STAY_STATUSES = [
        'reserved',
        'checked_in',
        'checked_out',
        'no_show',
    ];

    public function index(Request $request): Response
    {
        $user = $request->user();

        $query = Booking::query()
            ->with(['hotel', 'user'])
            ->whereHas('hotel', fn ($builder) => $builder->where('vendor_id', $user->id))
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('hotel_id')) {
            $query->where('hotel_id', (int) $request->input('hotel_id'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }

        $bookings = $query
            ->paginate(\App\Support\PaginationOptions::perPage())
            ->withQueryString()
            ->through(fn (Booking $booking) => $this->toPayload($booking));

        return Inertia::render('admin/bookings/index', [
            'bookings' => $bookings,
            'filters' => [
                'status' => $request->input('status'),
                'hotel_id' => $request->input('hotel_id'),
                'date_from' => $request->input('date_from'),
                'date_to' => $request->input('date_to'),
            ],
            'statusOptions' => self::STATUSES,
            'hotelOptions' => $this->hotelOptions($user->id),
            'isMitra' => true,
            'basePath' => '/mitra/bookings',
        ]);
    }

    public function show(Request $request, Booking $booking): Response
    {
        $user = $request->user();
        if ((int) $booking->hotel?->vendor_id !== (int) $user->id) {
            abort(404);
        }

        $booking->load(['hotel', 'user', 'rooms.roomType', 'payments', 'auditLogs.admin']);

        return Inertia::render('admin/bookings/show', [
            'booking' => $this->detailPayload($booking),
            'isMitra' => true,
            'basePath' => '/mitra/bookings',
        ]);
    }

    public function cancel(Request $request, Booking $booking, BookingService $bookingService): RedirectResponse
    {
        $user = $request->user();
        if ((int) $booking->hotel?->vendor_id !== (int) $user->id) {
            abort(404);
        }

        $data = $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
        ]);

        if (! in_array($booking->status, ['pending_payment', 'paid', 'completed', 'no_show'], true)) {
            return back()->withErrors(['status' => 'Booking tidak bisa dibatalkan dari status ini.']);
        }

        $booking->load('rooms.roomType');

        foreach ($booking->rooms as $room) {
            if (! $room->roomType) {
                continue;
            }

            $bookingService->releaseInventory(
                $room->roomType,
                $booking->check_in->toDateString(),
                $booking->check_out->toDateString(),
                $room->rooms_count
            );
        }

        $booking->status = 'cancelled';
        if ($booking->payment_status !== 'refunded') {
            $booking->payment_status = 'cancelled';
        }
        $booking->save();

        $this->logAction($booking, 'cancel', $data['reason']);

        return back()->with('status', 'booking-cancelled');
    }

    public function refund(Request $request, Booking $booking): RedirectResponse
    {
        return back()->withErrors([
            'action' => 'Refund hanya dapat dilakukan oleh admin.',
        ]);
    }

    public function dispute(Request $request, Booking $booking): RedirectResponse
    {
        $user = $request->user();
        if ((int) $booking->hotel?->vendor_id !== (int) $user->id) {
            abort(404);
        }

        $data = $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
        ]);

        $booking->payment_status = 'disputed';
        $booking->save();

        $this->logAction($booking, 'dispute', $data['reason']);

        return back()->with('status', 'booking-disputed');
    }

    public function updateStayStatus(Request $request, Booking $booking): RedirectResponse
    {
        $user = $request->user();
        if ((int) $booking->hotel?->vendor_id !== (int) $user->id) {
            abort(404);
        }

        $data = $request->validate([
            'stay_status' => ['required', 'string', \Illuminate\Validation\Rule::in(self::STAY_STATUSES)],
        ]);

        if (in_array($booking->status, ['cancelled', 'expired'], true)) {
            return back()->withErrors(['status' => 'Booking tidak bisa diubah karena sudah dibatalkan atau kedaluwarsa.']);
        }

        $booking->stay_status = $data['stay_status'];
        if ($data['stay_status'] === 'checked_in') {
            $booking->checked_in_at = now();
        }
        if ($data['stay_status'] === 'checked_out') {
            $booking->checked_out_at = now();
            if ($booking->status !== 'completed') {
                $booking->status = 'completed';
            }
        }
        if ($data['stay_status'] === 'no_show') {
            $booking->no_show_at = now();
            if ($booking->status !== 'no_show') {
                $booking->status = 'no_show';
            }
        }
        $booking->save();

        $this->logAction($booking, 'stay_status', sprintf('Stay status -> %s', $data['stay_status']));

        return back()->with('status', 'booking-stay-updated');
    }

    public function updateNotes(Request $request, Booking $booking): RedirectResponse
    {
        $user = $request->user();
        if ((int) $booking->hotel?->vendor_id !== (int) $user->id) {
            abort(404);
        }

        $data = $request->validate([
            'internal_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $booking->internal_notes = $data['internal_notes'] ?? null;
        $booking->save();

        $this->logAction($booking, 'internal_notes', 'Update catatan internal');

        return back()->with('status', 'booking-notes-updated');
    }

    private function logAction(Booking $booking, string $action, ?string $reason = null): void
    {
        BookingAuditLog::create([
            'booking_id' => $booking->id,
            'admin_id' => auth()->id(),
            'action' => $action,
            'reason' => $reason,
        ]);
    }

    private function hotelOptions(int $vendorId): array
    {
        return Hotel::query()
            ->select('id', 'name')
            ->where('vendor_id', $vendorId)
            ->orderBy('name')
            ->get()
            ->map(fn (Hotel $hotel) => [
                'id' => $hotel->id,
                'label' => $hotel->name,
            ])
            ->all();
    }

    private function toPayload(Booking $booking): array
    {
        return [
            'id' => $booking->id,
            'midtrans_order_id' => $booking->midtrans_order_id,
            'hotel_name' => $booking->hotel?->name,
            'guest_name' => $booking->guest_name,
            'guest_email' => $booking->guest_email,
            'guest_phone' => $booking->guest_phone,
            'check_in' => $booking->check_in?->toDateString(),
            'check_out' => $booking->check_out?->toDateString(),
            'nights' => $booking->nights,
            'rooms_count' => $booking->rooms_count,
            'guests_count' => $booking->guests_count,
            'total' => $booking->total,
            'status' => $booking->status,
            'stay_status' => $booking->stay_status,
            'payment_status' => $booking->payment_status,
            'created_at' => $booking->created_at?->toDateTimeString(),
        ];
    }

    private function detailPayload(Booking $booking): array
    {
        return [
            'id' => $booking->id,
            'midtrans_order_id' => $booking->midtrans_order_id,
            'status' => $booking->status,
            'stay_status' => $booking->stay_status,
            'payment_status' => $booking->payment_status,
            'payment_deadline' => $booking->payment_deadline?->toDateTimeString(),
            'total' => $booking->total,
            'subtotal' => $booking->subtotal,
            'currency' => $booking->currency,
            'check_in' => $booking->check_in?->toDateString(),
            'check_out' => $booking->check_out?->toDateString(),
            'nights' => $booking->nights,
            'rooms_count' => $booking->rooms_count,
            'guests_count' => $booking->guests_count,
            'special_request' => $booking->special_request,
            'internal_notes' => $booking->internal_notes,
            'checked_in_at' => $booking->checked_in_at?->toDateTimeString(),
            'checked_out_at' => $booking->checked_out_at?->toDateTimeString(),
            'no_show_at' => $booking->no_show_at?->toDateTimeString(),
            'created_at' => $booking->created_at?->toDateTimeString(),
            'hotel' => [
                'id' => $booking->hotel?->id,
                'name' => $booking->hotel?->name,
                'address' => $booking->hotel?->address,
            ],
            'guest' => [
                'name' => $booking->guest_name,
                'email' => $booking->guest_email,
                'phone' => $booking->guest_phone,
                'user' => $booking->user?->name,
            ],
            'rooms' => $booking->rooms->map(fn ($room) => [
                'id' => $room->id,
                'room_type' => $room->roomType?->name,
                'rooms_count' => $room->rooms_count,
                'guests_count' => $room->guests_count,
                'price_per_night' => $room->price_per_night,
                'subtotal' => $room->subtotal,
            ])->all(),
            'payments' => $booking->payments->map(fn ($payment) => [
                'id' => $payment->id,
                'status' => $payment->status,
                'payment_type' => $payment->payment_type,
                'gross_amount' => $payment->gross_amount,
                'created_at' => $payment->created_at?->toDateTimeString(),
            ])->all(),
            'audit_logs' => $booking->auditLogs->map(fn ($log) => [
                'id' => $log->id,
                'action' => $log->action,
                'reason' => $log->reason,
                'admin_name' => $log->admin?->name,
                'created_at' => $log->created_at?->toDateTimeString(),
            ])->all(),
        ];
    }
}
