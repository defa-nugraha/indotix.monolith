<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademyBooking;
use App\Models\AcademyClass;
use App\Models\AcademyPayment;
use App\Models\AcademyTicket;
use App\Models\UserNotification;
use App\Services\MidtransService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Spatie\LaravelPdf\Facades\Pdf;

class AcademyBookingController extends Controller
{
    private const PAYMENT_TTL_MINUTES = 15;

    public function index(Request $request): JsonResponse
    {
        $bookings = AcademyBooking::query()
            ->where('user_id', $request->user()->id)
            ->with(['academyClass', 'ticket', 'payments'])
            ->latest()
            ->get()
            ->map(fn (AcademyBooking $booking) => $this->bookingPayload($booking));

        return response()->json([
            'bookings' => $bookings,
        ]);
    }

    public function quote(Request $request): JsonResponse
    {
        $data = $request->validate([
            'class_id' => ['required', 'integer', 'exists:academy_classes,id'],
            'ticket_id' => ['required', 'integer', 'exists:academy_tickets,id'],
            'quantity' => ['required', 'integer', 'min:1', 'max:20'],
        ]);

        $class = AcademyClass::query()
            ->where('id', $data['class_id'])
            ->where('is_active', true)
            ->whereIn('status', ['scheduled', 'open_for_sale'])
            ->firstOrFail();

        $ticket = AcademyTicket::query()->findOrFail($data['ticket_id']);
        if ((int) $ticket->academy_class_id !== (int) $class->id) {
            return response()->json(['message' => 'Tiket tidak sesuai kelas.'], 422);
        }

        if (! $ticket->is_active) {
            return response()->json(['message' => 'Tiket belum tersedia.'], 422);
        }

        if (! $this->isTicketOnSale($ticket)) {
            return response()->json(['message' => 'Penjualan tiket belum dibuka atau sudah berakhir.'], 422);
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
            'class_id' => ['required', 'integer', 'exists:academy_classes,id'],
            'ticket_id' => ['required', 'integer', 'exists:academy_tickets,id'],
            'quantity' => ['required', 'integer', 'min:1', 'max:20'],
            'guest_name' => ['required', 'string', 'max:255'],
            'guest_email' => ['required', 'email', 'max:255'],
        ]);

        $profilePhone = $request->user()?->phone;
        if (! $profilePhone) {
            return response()->json(['message' => 'Nomor HP belum diisi di profil.'], 422);
        }
        $data['guest_phone'] = $profilePhone;

        $class = AcademyClass::query()
            ->where('id', $data['class_id'])
            ->where('is_active', true)
            ->whereIn('status', ['scheduled', 'open_for_sale'])
            ->firstOrFail();

        try {
            $booking = DB::transaction(function () use ($request, $data, $class) {
                $ticket = AcademyTicket::query()->lockForUpdate()->findOrFail($data['ticket_id']);
                if ((int) $ticket->academy_class_id !== (int) $class->id) {
                    throw new RuntimeException('Tiket tidak sesuai kelas.');
                }

                if (! $ticket->is_active) {
                    throw new RuntimeException('Tiket belum tersedia.');
                }

                if (! $this->isTicketOnSale($ticket)) {
                    throw new RuntimeException('Penjualan tiket belum dibuka atau sudah berakhir.');
                }

                if ($this->availableTickets($ticket, true) < (int) $data['quantity']) {
                    throw new RuntimeException('Kuota tiket tidak mencukupi.');
                }

                return AcademyBooking::create([
                    'user_id' => $request->user()->id,
                    'academy_class_id' => $class->id,
                    'academy_ticket_id' => $ticket->id,
                    'booking_code' => strtoupper('ACADEMY-'.$request->user()->id.'-'.now()->format('ymdHis')),
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
            'title' => 'Pemesanan kelas berhasil',
            'message' => 'Pesanan kelas sudah dibuat. Silakan lanjutkan pembayaran.',
            'type' => 'academy_booking_created',
            'data' => [
                'booking_id' => $this->encryptId($booking->id),
                'type' => 'academy',
                'category' => 'academy',
            ],
        ]);

        UserNotification::create([
            'user_id' => $request->user()->id,
            'title' => 'Menunggu pembayaran kelas',
            'message' => 'Ada pembayaran kelas yang perlu diselesaikan.',
            'type' => 'academy_payment_pending',
            'data' => [
                'booking_id' => $this->encryptId($booking->id),
                'type' => 'academy',
                'category' => 'academy',
            ],
        ]);

        $booking->load(['academyClass', 'ticket', 'payments']);

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

        $booking->load(['academyClass', 'ticket', 'payments']);

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
            $booking->load(['academyClass', 'ticket', 'payments']);

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

        $orderId = sprintf('ACADEMY-%s-%s', $booking->id, now()->format('YmdHis'));
        $payload = $this->buildSnapPayload($booking, $orderId);

        try {
            $charge = $midtransService->snap($payload);
        } catch (\Throwable $exception) {
            return response()->json(['message' => 'Gagal menghubungi server pembayaran. Silakan coba lagi.'], 500);
        }

        $payment = AcademyPayment::create([
            'academy_booking_id' => $booking->id,
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
            'message' => 'Pesanan kelas kamu berhasil dibatalkan.',
            'type' => 'academy_booking_cancelled',
            'data' => [
                'booking_id' => $this->encryptId($booking->id),
                'type' => 'academy',
                'category' => 'academy',
            ],
        ]);

        $booking->load(['academyClass', 'ticket', 'payments']);

        return response()->json([
            'booking' => $this->bookingPayload($booking),
        ]);
    }

    public function ticket(Request $request, string $booking)
    {
        $booking = $this->resolveBooking($booking);

        if ((int) $booking->user_id !== (int) $request->user()->id) {
            return response()->json(['message' => 'Data tidak ditemukan.'], 404);
        }

        if (! in_array($booking->status, ['paid', 'completed'], true)) {
            return response()->json(['message' => 'Tiket hanya tersedia setelah pembayaran berhasil.'], 422);
        }

        $booking->load('ticket', 'academyClass');

        $filename = sprintf('tiket-academy-%s.pdf', $booking->id);

        $qrImage = null;
        $qrUrl = $this->buildQrUrl('ACADEMY', $booking->booking_code);
        $context = stream_context_create(['http' => ['timeout' => 4]]);
        $contents = @file_get_contents($qrUrl, false, $context);
        if ($contents !== false) {
            $qrImage = 'data:image/png;base64,'.base64_encode($contents);
        }

        return Pdf::view('academy-ticket', [
            'booking' => $booking,
            'qrImage' => $qrImage,
        ])->download($filename);
    }

    public function qr(Request $request, string $booking)
    {
        $booking = $this->resolveBooking($booking);

        if ((int) $booking->user_id !== (int) $request->user()->id) {
            return response()->json(['message' => 'Data tidak ditemukan.'], 404);
        }

        if (! in_array($booking->status, ['paid', 'completed'], true)) {
            return response()->json(['message' => 'QR hanya tersedia setelah pembayaran berhasil.'], 422);
        }

        $qrUrl = $this->buildQrUrl('ACADEMY', $booking->booking_code);
        $context = stream_context_create(['http' => ['timeout' => 4]]);
        $contents = @file_get_contents($qrUrl, false, $context);
        if ($contents === false) {
            return response()->json(['message' => 'Gagal memuat QR.'], 500);
        }

        return response($contents, 200)
            ->header('Content-Type', 'image/png')
            ->header('Content-Disposition', 'attachment; filename="qr-academy-'.$booking->id.'.png"');
    }

    private function bookingPayload(AcademyBooking $booking): array
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
            'class' => [
                'id' => $booking->academyClass?->id,
                'title' => $booking->academyClass?->title,
                'location' => $booking->academyClass?->location_detail,
                'start_at' => $booking->academyClass?->start_at?->toDateTimeString(),
            ],
            'guest' => [
                'name' => $booking->guest_name,
                'email' => $booking->guest_email,
                'phone' => $booking->guest_phone,
            ],
            'qr_data' => $this->buildQrData('ACADEMY', (string) $booking->booking_code),
            'qr_url' => $this->buildQrUrl('ACADEMY', (string) $booking->booking_code),
            'payment' => $payment ? [
                'status' => $payment->status,
                'payment_type' => $payment->payment_type,
                'payload' => $payment->payload,
            ] : null,
        ];
    }

    private function availableTickets(AcademyTicket $ticket, bool $useLock = false): int
    {
        if ($ticket->quota === null) {
            return 9999;
        }

        $query = AcademyBooking::query()
            ->where('academy_ticket_id', $ticket->id)
            ->whereIn('status', ['pending_payment', 'paid', 'completed']);

        if ($useLock) {
            $query->lockForUpdate();
        }

        $reserved = (int) $query->sum('quantity');

        return max(0, (int) $ticket->quota - $reserved);
    }

    private function isTicketOnSale(AcademyTicket $ticket): bool
    {
        $now = now();

        if ($ticket->sales_start_at && $ticket->sales_start_at->isFuture()) {
            return false;
        }

        if ($ticket->sales_end_at && $ticket->sales_end_at->isPast()) {
            return false;
        }

        return true;
    }

    private function buildSnapPayload(AcademyBooking $booking, string $orderId): array
    {
        return [
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => (int) $booking->total_price,
            ],
            'item_details' => [
                [
                    'id' => (string) $booking->ticket?->id,
                    'price' => (int) $booking->total_price / max(1, (int) $booking->quantity),
                    'quantity' => (int) $booking->quantity,
                    'name' => $booking->ticket?->name ?? 'Tiket Academy',
                ],
            ],
            'customer_details' => [
                'first_name' => $booking->guest_name,
                'email' => $booking->guest_email,
                'phone' => $booking->guest_phone,
            ],
        ];
    }

    private function resolveBooking(string $booking): AcademyBooking
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

        return AcademyBooking::query()->findOrFail($id);
    }

    private function encryptId(int $id): string
    {
        return Crypt::encryptString((string) $id);
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
