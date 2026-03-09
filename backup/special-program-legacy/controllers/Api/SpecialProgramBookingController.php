<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventTicket;
use App\Models\Hotel;
use App\Models\MitraWisataOnboarding;
use App\Models\SpecialProgram;
use App\Models\SpecialProgramBooking;
use App\Models\SpecialProgramPayment;
use App\Models\UserNotification;
use App\Models\WisataTicket;
use App\Services\MidtransService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class SpecialProgramBookingController extends Controller
{
    private const PAYMENT_TTL_MINUTES = 15;

    public function index(Request $request): JsonResponse
    {
        $bookings = SpecialProgramBooking::query()
            ->where('user_id', $request->user()->id)
            ->with(['program', 'payments'])
            ->latest()
            ->get()
            ->map(fn (SpecialProgramBooking $booking) => $this->bookingPayload($booking));

        return response()->json([
            'bookings' => $bookings,
        ]);
    }

    public function quote(Request $request): JsonResponse
    {
        $data = $request->validate([
            'program_id' => ['required', 'integer', 'exists:special_programs,id'],
            'item_type' => ['required', 'in:hotel,wisata,event'],
            'item_id' => ['required', 'integer'],
            'ticket_id' => ['nullable', 'integer'],
            'visit_date' => ['nullable', 'date'],
            'quantity' => ['required', 'integer', 'min:1', 'max:20'],
        ]);

        if ($data['item_type'] === 'wisata' && empty($data['visit_date'])) {
            return response()->json(['message' => 'Tanggal kunjungan wajib diisi.'], 422);
        }

        $program = SpecialProgram::query()
            ->where('is_active', true)
            ->whereIn('status', ['active', 'scheduled'])
            ->findOrFail($data['program_id']);

        $item = SpecialProgramItem::query()
            ->where('special_program_id', $program->id)
            ->where('item_type', $data['item_type'])
            ->where('item_id', $data['item_id'])
            ->where('is_active', true)
            ->first();

        if (! $item) {
            return response()->json(['message' => 'Produk tidak tersedia dalam program ini.'], 422);
        }

        $payload = $this->resolveTicketPayload(
            $data['item_type'],
            (int) $data['item_id'],
            $data['ticket_id'] ?? null,
            $data['visit_date'] ?? null
        );
        if (! $payload) {
            return response()->json(['message' => 'Tiket tidak ditemukan.'], 422);
        }

        if ($data['item_type'] === 'event') {
            $ticket = $payload['ticket_model'] ?? null;
            if (! $ticket || $this->availableEventTickets($ticket) < (int) $data['quantity']) {
                return response()->json(['message' => 'Kuota tiket tidak mencukupi.'], 422);
            }
        }

        if ($data['item_type'] === 'wisata') {
            $ticket = $payload['ticket_model'] ?? null;
            if (! $ticket || $this->availableWisataTickets($ticket, (string) $data['visit_date']) < (int) $data['quantity']) {
                return response()->json(['message' => 'Kuota tiket tidak mencukupi.'], 422);
            }
        }

        $total = (int) $payload['unit_price'] * (int) $data['quantity'];

        return response()->json([
            'pricing' => [
                'unit_price' => (int) $payload['unit_price'],
                'quantity' => (int) $data['quantity'],
                'total' => $total,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'program_id' => ['required', 'integer', 'exists:special_programs,id'],
            'item_type' => ['required', 'in:hotel,wisata,event'],
            'item_id' => ['required', 'integer'],
            'ticket_id' => ['nullable', 'integer'],
            'visit_date' => ['nullable', 'date'],
            'quantity' => ['required', 'integer', 'min:1', 'max:20'],
            'guest_name' => ['required', 'string', 'max:255'],
            'guest_email' => ['required', 'email', 'max:255'],
            'guest_phone' => ['required', 'string', 'max:30'],
            'special_request' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($data['item_type'] === 'wisata' && empty($data['visit_date'])) {
            return response()->json(['message' => 'Tanggal kunjungan wajib diisi.'], 422);
        }

        $program = SpecialProgram::query()
            ->where('is_active', true)
            ->whereIn('status', ['active', 'scheduled'])
            ->findOrFail($data['program_id']);

        $item = SpecialProgramItem::query()
            ->where('special_program_id', $program->id)
            ->where('item_type', $data['item_type'])
            ->where('item_id', $data['item_id'])
            ->where('is_active', true)
            ->first();

        if (! $item) {
            return response()->json(['message' => 'Produk tidak tersedia dalam program ini.'], 422);
        }

        $payload = $this->resolveTicketPayload(
            $data['item_type'],
            (int) $data['item_id'],
            $data['ticket_id'] ?? null,
            $data['visit_date'] ?? null
        );
        if (! $payload) {
            return response()->json(['message' => 'Tiket tidak ditemukan.'], 422);
        }

        $total = (int) $payload['unit_price'] * (int) $data['quantity'];

        try {
            $booking = DB::transaction(function () use ($request, $data, $program, $payload, $total) {
                if ($data['item_type'] === 'event') {
                    $ticket = EventTicket::query()->lockForUpdate()->findOrFail($data['ticket_id']);
                    if ((int) $ticket->event_id !== (int) $data['item_id']) {
                        throw new RuntimeException('Tiket tidak sesuai event.');
                    }
                    if (! $ticket->is_active) {
                        throw new RuntimeException('Tiket belum tersedia.');
                    }
                    if ($this->availableEventTickets($ticket, true) < (int) $data['quantity']) {
                        throw new RuntimeException('Kuota tiket tidak mencukupi.');
                    }
                }

                if ($data['item_type'] === 'wisata') {
                    $ticket = WisataTicket::query()->lockForUpdate()->findOrFail($data['ticket_id']);
                    if ((int) $ticket->mitra_wisata_onboarding_id !== (int) $data['item_id']) {
                        throw new RuntimeException('Tiket tidak sesuai destinasi.');
                    }
                    if (! $ticket->is_active || $ticket->is_closed) {
                        throw new RuntimeException('Tiket belum tersedia.');
                    }
                    if ($this->availableWisataTickets($ticket, (string) $data['visit_date'], true) < (int) $data['quantity']) {
                        throw new RuntimeException('Kuota tiket tidak mencukupi.');
                    }
                }

                return SpecialProgramBooking::create([
                    'user_id' => $request->user()->id,
                    'special_program_id' => $program->id,
                    'item_type' => $data['item_type'],
                    'item_id' => $data['item_id'],
                    'item_name' => $payload['item']['title'] ?? $payload['item']['name'] ?? 'Special Program',
                    'city_name' => $payload['item']['city_name'] ?? null,
                    'visit_date' => $payload['visit_date'] ?? null,
                    'ticket_name' => $payload['ticket_name'] ?? null,
                    'quantity' => $data['quantity'],
                    'unit_price' => $payload['unit_price'],
                    'total_price' => $total,
                    'status' => 'pending_payment',
                    'payment_status' => 'pending',
                    'payment_deadline' => now()->addMinutes(self::PAYMENT_TTL_MINUTES),
                    'guest_name' => $data['guest_name'],
                    'guest_email' => $data['guest_email'],
                    'guest_phone' => $data['guest_phone'],
                    'special_request' => $data['special_request'] ?? null,
                ]);
            });
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        UserNotification::create([
            'user_id' => $request->user()->id,
            'title' => 'Pemesanan special program berhasil',
            'message' => 'Pesanan special program sudah dibuat. Silakan lanjutkan pembayaran.',
            'type' => 'special_program_booking_created',
            'data' => [
                'booking_id' => Crypt::encryptString((string) $booking->id),
                'category' => 'special_program',
            ],
        ]);

        UserNotification::create([
            'user_id' => $request->user()->id,
            'title' => 'Menunggu pembayaran special program',
            'message' => 'Ada pembayaran special program yang perlu diselesaikan.',
            'type' => 'special_program_payment_pending',
            'data' => [
                'booking_id' => Crypt::encryptString((string) $booking->id),
                'category' => 'special_program',
            ],
        ]);

        $booking->load(['program', 'payments']);

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

        $booking->load(['program', 'payments']);

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

        if ($booking->status === 'pending_payment' && $booking->payment_deadline && $booking->payment_deadline->isPast()) {
            $booking->update(['status' => 'expired', 'payment_status' => 'expired']);
            return response()->json(['message' => 'Booking sudah kedaluwarsa.'], 422);
        }

        if ($booking->status !== 'pending_payment') {
            $booking->load(['program', 'payments']);

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

        $orderId = sprintf('SPP-%s-%s', $booking->id, now()->format('YmdHis'));
        $payload = $this->buildSnapPayload($booking, $orderId);

        try {
            $charge = $midtransService->snap($payload);
        } catch (\Throwable $exception) {
            return response()->json(['message' => 'Gagal menghubungi server pembayaran. Silakan coba lagi.'], 500);
        }

        $payment = SpecialProgramPayment::create([
            'special_program_booking_id' => $booking->id,
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
            'message' => 'Pesanan special program kamu berhasil dibatalkan.',
            'type' => 'special_program_booking_cancelled',
            'data' => [
                'booking_id' => Crypt::encryptString((string) $booking->id),
                'category' => 'special_program',
            ],
        ]);

        $booking->load(['program', 'payments']);

        return response()->json([
            'booking' => $this->bookingPayload($booking),
        ]);
    }

    private function bookingPayload(SpecialProgramBooking $booking): array
    {
        $payment = $booking->payments()->latest()->first();

        return [
            'id' => $booking->id,
            'encrypted_id' => Crypt::encryptString((string) $booking->id),
            'program' => [
                'id' => $booking->special_program_id,
                'name' => $booking->program?->name,
            ],
            'item' => [
                'type' => $booking->item_type,
                'name' => $booking->item_name,
                'city_name' => $booking->city_name,
            ],
            'quantity' => $booking->quantity,
            'unit_price' => $booking->unit_price,
            'total' => $booking->total_price,
            'status' => $booking->status,
            'payment_status' => $booking->payment_status,
            'payment_deadline' => $booking->payment_deadline?->toIso8601String(),
            'ticket_name' => $booking->ticket_name,
            'guest' => [
                'name' => $booking->guest_name,
                'email' => $booking->guest_email,
                'phone' => $booking->guest_phone,
            ],
            'payment' => $payment ? [
                'status' => $payment->status,
                'payload' => $payment->payload,
            ] : null,
        ];
    }

    private function resolveBooking(string $booking): SpecialProgramBooking
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

        return SpecialProgramBooking::query()->findOrFail($id);
    }

    private function buildSnapPayload(SpecialProgramBooking $booking, string $orderId): array
    {
        return [
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => (int) $booking->total_price,
            ],
            'item_details' => [
                [
                    'id' => (string) $booking->id,
                    'price' => (int) $booking->unit_price,
                    'quantity' => (int) $booking->quantity,
                    'name' => $booking->ticket_name ?? $booking->item_name,
                ],
            ],
            'customer_details' => [
                'first_name' => $booking->guest_name,
                'email' => $booking->guest_email,
                'phone' => $booking->guest_phone,
            ],
        ];
    }

    private function resolveTicketPayload(string $itemType, int $itemId, ?int $ticketId, ?string $visitDate): ?array
    {
        if ($itemType === 'hotel') {
            $hotel = Hotel::query()->with('city')->find($itemId);
            if (! $hotel) {
                return null;
            }
            $minPrice = $hotel->roomTypes()->min('base_price');
            if (! $minPrice) {
                return null;
            }

            return [
                'item' => [
                    'id' => $hotel->id,
                    'title' => $hotel->name,
                    'city_name' => $hotel->city?->name,
                ],
                'ticket_id' => null,
                'ticket_name' => 'Booking Hotel',
                'unit_price' => (int) round($minPrice),
            ];
        }

        if ($itemType === 'wisata') {
            $destination = MitraWisataOnboarding::query()->find($itemId);
            if (! $destination) {
                return null;
            }
            $ticket = $ticketId ? WisataTicket::query()->find($ticketId) : null;
            if (
                ! $ticket
                || (int) $ticket->mitra_wisata_onboarding_id !== (int) $destination->id
                || ! $ticket->is_active
                || $ticket->is_closed
            ) {
                return null;
            }

            return [
                'item' => [
                    'id' => $destination->id,
                    'title' => $destination->destination_name,
                    'city_name' => $this->resolveCityName($destination->city_code),
                ],
                'ticket_id' => $ticket->id,
                'ticket_name' => $ticket->name,
                'unit_price' => (int) $ticket->price,
                'visit_date' => $visitDate,
                'ticket_model' => $ticket,
            ];
        }

        if ($itemType === 'event') {
            $event = Event::query()->find($itemId);
            if (! $event) {
                return null;
            }
            $ticket = $ticketId ? EventTicket::query()->find($ticketId) : null;
            if (! $ticket || (int) $ticket->event_id !== (int) $event->id || ! $ticket->is_active) {
                return null;
            }

            return [
                'item' => [
                    'id' => $event->id,
                    'title' => $event->title,
                    'city_name' => $this->resolveCityName($event->city_code),
                ],
                'ticket_id' => $ticket->id,
                'ticket_name' => $ticket->name,
                'unit_price' => (int) $ticket->price,
                'visit_date' => $event->start_at?->toDateString(),
                'ticket_model' => $ticket,
            ];
        }

        return null;
    }

    private function availableEventTickets(EventTicket $ticket, bool $useLock = false): int
    {
        $query = \App\Models\EventBooking::query()
            ->where('event_ticket_id', $ticket->id)
            ->whereIn('status', ['pending_payment', 'paid', 'completed']);

        if ($useLock) {
            $query->lockForUpdate();
        }

        $reserved = (int) $query->sum('quantity');

        return max(0, (int) $ticket->quota - $reserved);
    }

    private function availableWisataTickets(WisataTicket $ticket, string $date, bool $useLock = false): int
    {
        $query = \App\Models\WisataBooking::query()
            ->where('wisata_ticket_id', $ticket->id)
            ->whereDate('visit_date', $date)
            ->whereIn('status', ['pending_payment', 'paid', 'completed']);

        if ($useLock) {
            $query->lockForUpdate();
        }

        $reserved = (int) $query->sum('quantity');
        $maxQuota = $ticket->daily_quota ?? $ticket->quota;

        return max(0, (int) $maxQuota - $reserved);
    }

    private function resolveCityName(?string $cityCode): ?string
    {
        if (! $cityCode) {
            return null;
        }

        return DB::table('regencies')->where('code', $cityCode)->value('name');
    }
}
