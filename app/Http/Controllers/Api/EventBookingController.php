<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventBooking;
use App\Models\EventPayment;
use App\Models\EventTicket;
use App\Models\UserNotification;
use App\Services\MidtransService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class EventBookingController extends Controller
{
    private const PAYMENT_TTL_MINUTES = 15;

    public function index(Request $request): JsonResponse
    {
        $bookings = EventBooking::query()
            ->where('user_id', $request->user()->id)
            ->whereHas('event', fn ($q) => $q->where('event_type', 'event'))
            ->with(['event', 'ticket', 'payments'])
            ->latest()
            ->get()
            ->map(fn (EventBooking $booking) => $this->bookingPayload($booking));

        return response()->json([
            'bookings' => $bookings,
        ]);
    }

    public function quote(Request $request): JsonResponse
    {
        $data = $request->validate([
            'event_id' => ['required', 'string'],
            'ticket_id' => ['required', 'string'],
            'quantity' => ['required', 'integer', 'min:1', 'max:20'],
        ]);

        $eventId = $this->resolveEntityId($data['event_id']);
        if (! $eventId) {
            return $this->invalidIdResponse('event_id');
        }
        $ticketId = $this->resolveEntityId($data['ticket_id']);
        if (! $ticketId) {
            return $this->invalidIdResponse('ticket_id');
        }
        $data['event_id'] = $eventId;
        $data['ticket_id'] = $ticketId;

        $event = Event::query()
            ->where('id', $data['event_id'])
            ->where('event_type', 'event')
            ->where('status', 'published')
            ->first();

        if (! $event) {
            return response()->json(['message' => 'Event tidak tersedia.'], 422);
        }
        if ($this->isScheduleEnded($event->end_at, $event->start_at)) {
            return response()->json(['message' => 'Event sudah berakhir.'], 422);
        }

        $ticket = EventTicket::query()->find($data['ticket_id']);
        if (! $ticket) {
            return response()->json(['message' => 'Tiket tidak tersedia.'], 422);
        }
        if ((int) $ticket->event_id !== (int) $event->id) {
            return response()->json(['message' => 'Tiket tidak sesuai event.'], 422);
        }

        if (! $ticket->is_active) {
            return response()->json(['message' => 'Tiket belum tersedia.'], 422);
        }

        if ($this->availableTickets($ticket) < (int) $data['quantity']) {
            return response()->json(['message' => 'Kuota tiket tidak mencukupi.'], 422);
        }

        $total = (int) $ticket->price * (int) $data['quantity'];

        return response()->json([
            'pricing' => [
                'unit_price' => (int) $ticket->price,
                'quantity' => (int) $data['quantity'],
                'total' => $total,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'event_id' => ['required', 'string'],
            'ticket_id' => ['required', 'string'],
            'quantity' => ['required', 'integer', 'min:1', 'max:20'],
            'guest_name' => ['required', 'string', 'max:255'],
            'guest_email' => ['required', 'email', 'max:255'],
        ]);

        $eventId = $this->resolveEntityId($data['event_id']);
        if (! $eventId) {
            return $this->invalidIdResponse('event_id');
        }
        $ticketId = $this->resolveEntityId($data['ticket_id']);
        if (! $ticketId) {
            return $this->invalidIdResponse('ticket_id');
        }
        $data['event_id'] = $eventId;
        $data['ticket_id'] = $ticketId;

        $profilePhone = $request->user()?->phone;
        if (! $profilePhone) {
            return response()->json(['message' => 'Nomor HP belum diisi di profil.'], 422);
        }
        $data['guest_phone'] = $profilePhone;

        $event = Event::query()
            ->where('id', $data['event_id'])
            ->where('event_type', 'event')
            ->where('status', 'published')
            ->first();

        if (! $event) {
            return response()->json(['message' => 'Event tidak tersedia.'], 422);
        }
        if ($this->isScheduleEnded($event->end_at, $event->start_at)) {
            return response()->json(['message' => 'Event sudah berakhir.'], 422);
        }

        try {
            $booking = DB::transaction(function () use ($request, $data, $event) {
                $ticket = EventTicket::query()->lockForUpdate()->find($data['ticket_id']);
                if (! $ticket) {
                    throw new RuntimeException('Tiket tidak tersedia.');
                }
                if ((int) $ticket->event_id !== (int) $event->id) {
                    throw new RuntimeException('Tiket tidak sesuai event.');
                }

                if (! $ticket->is_active) {
                    throw new RuntimeException('Tiket belum tersedia.');
                }

                $available = $this->availableTickets($ticket, true);
                if ($available < (int) $data['quantity']) {
                    throw new RuntimeException('Kuota tiket tidak mencukupi.');
                }

                return EventBooking::create([
                    'user_id' => $request->user()->id,
                    'event_id' => $event->id,
                    'event_ticket_id' => $ticket->id,
                    'booking_code' => strtoupper('EVENT-'.$request->user()->id.'-'.now()->format('ymdHis')),
                    'quantity' => $data['quantity'],
                    'total_price' => $ticket->price * (int) $data['quantity'],
                    'status' => 'pending_payment',
                    'payment_status' => 'pending',
                    'payment_deadline' => now()->addMinutes(self::PAYMENT_TTL_MINUTES),
                    'guest_name' => $data['guest_name'],
                    'guest_email' => $data['guest_email'],
                    'guest_phone' => $data['guest_phone'],
                ]);
            });
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        UserNotification::create([
            'user_id' => $request->user()->id,
            'title' => 'Pemesanan event berhasil',
            'message' => 'Pesanan event sudah dibuat. Silakan lanjutkan pembayaran.',
            'type' => 'event_booking_created',
            'data' => [
                'booking_id' => $this->encryptId($booking->id),
                'type' => 'event',
                'category' => 'event',
            ],
        ]);

        UserNotification::create([
            'user_id' => $request->user()->id,
            'title' => 'Menunggu pembayaran event',
            'message' => 'Ada pembayaran event yang perlu diselesaikan.',
            'type' => 'event_payment_pending',
            'data' => [
                'booking_id' => $this->encryptId($booking->id),
                'type' => 'event',
                'category' => 'event',
            ],
        ]);

        $booking->load(['event', 'ticket', 'payments']);

        return response()->json([
            'booking' => $this->bookingPayload($booking),
        ], 201);
    }

    public function show(Request $request, string $booking): JsonResponse
    {
        $booking = $this->resolveBooking($booking);

        if ((int) $booking->user_id !== (int) $request->user()->id) {
            return response()->json(['message' => 'Data tidak ditemukan.'], 404);
        }

        $booking->load(['event', 'ticket', 'payments']);
        if ($booking->event?->event_type !== 'event') {
            return response()->json(['message' => 'Data tidak ditemukan.'], 404);
        }

        return response()->json([
            'booking' => $this->bookingPayload($booking),
        ]);
    }

    public function pay(Request $request, string $booking, MidtransService $midtransService): JsonResponse
    {
        $booking = $this->resolveBooking($booking);

        if ((int) $booking->user_id !== (int) $request->user()->id) {
            return response()->json(['message' => 'Data tidak ditemukan.'], 404);
        }
        $booking->loadMissing('event');
        if ($booking->event?->event_type !== 'event') {
            return response()->json(['message' => 'Data tidak ditemukan.'], 404);
        }

        if ($booking->status === 'pending_payment' && $booking->payment_deadline && $booking->payment_deadline->isPast()) {
            $booking->update(['status' => 'expired', 'payment_status' => 'expired']);

            return response()->json(['message' => 'Booking sudah kedaluwarsa.'], 422);
        }

        if ($booking->status !== 'pending_payment') {
            $booking->load(['event', 'ticket', 'payments']);

            return response()->json([
                'booking' => $this->bookingPayload($booking),
            ]);
        }

        if ($booking->payments()->where('status', 'pending')->exists()) {
            $payment = $booking->payments()->latest()->first();

            return response()->json([
                'payment' => [
                    'order_id' => $payment?->order_id,
                    'snap_token' => $payment?->payload['token'] ?? null,
                    'redirect_url' => $payment?->payload['redirect_url'] ?? null,
                    'payload' => $payment?->payload,
                ],
            ]);
        }

        $orderId = sprintf('EVENT-%s-%s', $booking->id, now()->format('YmdHis'));
        $payload = $this->buildSnapPayload($booking, $orderId);

        try {
            $charge = $midtransService->snap($payload);
        } catch (\Throwable $exception) {
            Log::warning('Midtrans event snap payment failed', [
                'booking_id' => $booking->id,
                'order_id' => $orderId,
                'message' => $exception->getMessage(),
            ]);

            return response()->json(['message' => 'Gagal menghubungi server pembayaran. Silakan coba lagi.'], 500);
        }

        $payment = EventPayment::create([
            'event_booking_id' => $booking->id,
            'provider' => 'midtrans',
            'status' => 'pending',
            'gross_amount' => (int) $booking->total_price,
            'payment_type' => 'snap',
            'transaction_id' => $charge['transaction_id'] ?? null,
            'order_id' => $orderId,
            'payload' => $charge,
        ]);

        $booking->update([
            'midtrans_order_id' => $payment->order_id,
            'payment_status' => $payment->status,
        ]);

        return response()->json([
            'payment' => [
                'order_id' => $payment->order_id,
                'snap_token' => $charge['token'] ?? null,
                'redirect_url' => $charge['redirect_url'] ?? null,
                'payload' => $charge,
            ],
        ]);
    }

    public function cancel(Request $request, string $booking): JsonResponse
    {
        $booking = $this->resolveBooking($booking);

        if ((int) $booking->user_id !== (int) $request->user()->id) {
            return response()->json(['message' => 'Data tidak ditemukan.'], 404);
        }
        $booking->loadMissing('event');
        if ($booking->event?->event_type !== 'event') {
            return response()->json(['message' => 'Data tidak ditemukan.'], 404);
        }

        if ($booking->status !== 'pending_payment') {
            return response()->json(['message' => 'Pesanan tidak dapat dibatalkan.'], 422);
        }

        $booking->update([
            'status' => 'cancelled',
            'payment_status' => 'cancelled',
        ]);

        UserNotification::create([
            'user_id' => $booking->user_id,
            'title' => 'Pesanan dibatalkan',
            'message' => 'Pesanan event kamu berhasil dibatalkan.',
            'type' => 'event_booking_cancelled',
            'data' => [
                'booking_id' => $this->encryptId($booking->id),
                'type' => 'event',
                'category' => 'event',
            ],
        ]);

        $booking->load(['event', 'ticket', 'payments']);

        return response()->json([
            'booking' => $this->bookingPayload($booking),
        ]);
    }

    private function bookingPayload(EventBooking $booking): array
    {
        $payment = $booking->payments()->latest()->first();

        return [
            'id' => $booking->id,
            'encrypted_id' => $this->encryptId($booking->id),
            'booking_code' => $booking->booking_code,
            'quantity' => $booking->quantity,
            'total' => $booking->total_price,
            'status' => $booking->status,
            'payment_status' => $booking->payment_status,
            'payment_deadline' => $booking->payment_deadline?->toIso8601String(),
            'ticket' => [
                'id' => $booking->ticket?->id,
                'name' => $booking->ticket?->name,
            ],
            'event' => [
                'id' => $booking->event?->id,
                'title' => $booking->event?->title,
                'location' => $booking->event?->location,
                'start_at' => $booking->event?->start_at?->toDateTimeString(),
            ],
            'guest' => [
                'name' => $booking->guest_name,
                'email' => $booking->guest_email,
                'phone' => $booking->guest_phone,
            ],
            'qr_data' => $this->buildQrData('EVENT', (string) $booking->booking_code),
            'qr_url' => $this->buildQrUrl('EVENT', (string) $booking->booking_code),
            'payment' => $payment ? [
                'status' => $payment->status,
                'payment_type' => $payment->payment_type,
                'payload' => $payment->payload,
            ] : null,
        ];
    }

    private function availableTickets(EventTicket $ticket, bool $useLock = false): int
    {
        $query = EventBooking::query()
            ->where('event_ticket_id', $ticket->id)
            ->whereIn('status', ['pending_payment', 'paid', 'completed']);

        if ($useLock) {
            $query->lockForUpdate();
        }

        $reserved = (int) $query->sum('quantity');

        return max(0, (int) $ticket->quota - $reserved);
    }

    private function buildSnapPayload(EventBooking $booking, string $orderId): array
    {
        return [
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => (int) $booking->total_price,
            ],
            'item_details' => [
                [
                    'id' => (string) $booking->ticket?->id,
                    'price' => intdiv((int) $booking->total_price, max(1, (int) $booking->quantity)),
                    'quantity' => (int) $booking->quantity,
                    'name' => $booking->ticket?->name ?? 'Tiket Event',
                ],
            ],
            'customer_details' => [
                'first_name' => $booking->guest_name,
                'email' => $booking->guest_email,
                'phone' => $booking->guest_phone,
            ],
        ];
    }

    private function resolveEntityId(string $value): ?int
    {
        if (ctype_digit($value)) {
            return (int) $value;
        }

        try {
            return (int) Crypt::decryptString($value);
        } catch (\Throwable $exception) {
            return null;
        }
    }

    private function invalidIdResponse(string $field): JsonResponse
    {
        return response()->json([
            'message' => 'ID tidak valid.',
            'errors' => [
                $field => ['ID tidak valid.'],
            ],
        ], 422);
    }

    private function resolveBooking(string $booking): EventBooking
    {
        if (ctype_digit($booking)) {
            $id = (int) $booking;
        } else {
            try {
                $id = Crypt::decryptString($booking);
            } catch (\Throwable $exception) {
                abort(404);
            }
        }

        return EventBooking::query()->findOrFail($id);
    }

    private function encryptId(int $id): string
    {
        return Crypt::encryptString((string) $id);
    }

    private function isScheduleEnded($endAt, $startAt): bool
    {
        $scheduleEnd = $endAt ?? $startAt;
        if (! $scheduleEnd) {
            return false;
        }

        return $scheduleEnd->isPast();
    }

    private function buildQrData(string $type, string $code): string
    {
        return sprintf('INDOTIX|%s|%s', $type, $code);
    }

    private function buildQrUrl(string $type, string $code): string
    {
        $data = rawurlencode($this->buildQrData($type, $code));

        return "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data={$data}";
    }
}
