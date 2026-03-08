<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MitraWisataOnboarding;
use App\Models\UserNotification;
use App\Models\WisataAffiliate;
use App\Models\WisataAffiliateCommission;
use App\Models\WisataAffiliateCommissionItem;
use App\Models\WisataAffiliateLink;
use App\Models\WisataBooking;
use App\Models\WisataPayment;
use App\Models\WisataTicket;
use App\Services\MidtransService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Spatie\LaravelPdf\Facades\Pdf;
use RuntimeException;

class WisataBookingController extends Controller
{
    private const PAYMENT_TTL_MINUTES = 15;

    public function index(Request $request): JsonResponse
    {
        $bookings = WisataBooking::query()
            ->where('user_id', $request->user()->id)
            ->with(['ticket', 'destination', 'payments'])
            ->latest()
            ->get()
            ->map(fn (WisataBooking $booking) => $this->bookingPayload($booking));

        return response()->json([
            'bookings' => $bookings,
        ]);
    }

    public function quote(Request $request): JsonResponse
    {
        $data = $request->validate([
            'destination_id' => ['required', 'integer', 'exists:mitra_wisata_onboardings,id'],
            'ticket_id' => ['required', 'integer', 'exists:wisata_tickets,id'],
            'visit_date' => ['required', 'date'],
            'quantity' => ['required', 'integer', 'min:1', 'max:20'],
        ]);

        $destination = MitraWisataOnboarding::query()
            ->where('id', $data['destination_id'])
            ->where('verification_status', 'verified')
            ->where('is_suspended', false)
            ->firstOrFail();

        if ($destination->is_temporarily_closed) {
            return response()->json(['message' => 'Destinasi sedang tutup sementara.'], 422);
        }

        $ticket = WisataTicket::query()->findOrFail($data['ticket_id']);
        if ((int) $ticket->mitra_wisata_onboarding_id !== (int) $destination->id) {
            return response()->json(['message' => 'Tiket tidak sesuai destinasi.'], 422);
        }

        if (! $ticket->is_active || $ticket->is_closed) {
            return response()->json(['message' => 'Tiket belum tersedia.'], 422);
        }

        if ($this->availableTickets($ticket, $data['visit_date']) < (int) $data['quantity']) {
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
            'destination_id' => ['required', 'integer', 'exists:mitra_wisata_onboardings,id'],
            'ticket_id' => ['required', 'integer', 'exists:wisata_tickets,id'],
            'visit_date' => ['required', 'date'],
            'quantity' => ['required', 'integer', 'min:1', 'max:20'],
            'guest_name' => ['required', 'string', 'max:255'],
            'guest_email' => ['required', 'email', 'max:255'],
            'guest_phone' => ['required', 'string', 'max:30'],
            'special_request' => ['nullable', 'string', 'max:1000'],
            'referral_code' => ['nullable', 'string', 'max:50'],
        ]);

        $destination = MitraWisataOnboarding::query()
            ->where('id', $data['destination_id'])
            ->where('verification_status', 'verified')
            ->where('is_suspended', false)
            ->firstOrFail();

        if ($destination->is_temporarily_closed) {
            return response()->json(['message' => 'Destinasi sedang tutup sementara.'], 422);
        }

        $link = $this->resolveAffiliateLinkFromCode($data['referral_code'] ?? null);

        try {
            $booking = DB::transaction(function () use ($request, $data, $destination, $link) {
                $ticket = WisataTicket::query()->lockForUpdate()->findOrFail($data['ticket_id']);
                if ((int) $ticket->mitra_wisata_onboarding_id !== (int) $destination->id) {
                    throw new RuntimeException('Tiket tidak sesuai destinasi.');
                }

                if (! $ticket->is_active || $ticket->is_closed) {
                    throw new RuntimeException('Tiket belum tersedia.');
                }

                $available = $this->availableTickets($ticket, $data['visit_date'], true);
                if ($available < (int) $data['quantity']) {
                    throw new RuntimeException('Kuota tiket tidak mencukupi.');
                }

                $order = WisataBooking::create([
                    'user_id' => $request->user()->id,
                    'mitra_wisata_onboarding_id' => $destination->id,
                    'wisata_ticket_id' => $ticket->id,
                    'booking_code' => strtoupper('WISATA-'.$request->user()->id.'-'.now()->format('ymdHis')),
                    'visit_date' => $data['visit_date'],
                    'quantity' => $data['quantity'],
                    'unit_price' => $ticket->price,
                    'total_price' => $ticket->price * (int) $data['quantity'],
                    'status' => 'pending_payment',
                    'payment_status' => 'pending',
                    'payment_deadline' => now()->addMinutes(self::PAYMENT_TTL_MINUTES),
                    'guest_name' => $data['guest_name'],
                    'guest_email' => $data['guest_email'],
                    'guest_phone' => $data['guest_phone'],
                    'special_request' => $data['special_request'] ?? null,
                ]);

                $this->attachAffiliateCommission($order, $link);

                return $order;
            });
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        UserNotification::create([
            'user_id' => $request->user()->id,
            'title' => 'Pemesanan tiket berhasil',
            'message' => 'Pesanan tiket wisata sudah dibuat. Silakan lanjutkan pembayaran.',
            'type' => 'wisata_booking_created',
            'data' => [
                'booking_id' => $this->encryptId($booking->id),
                'type' => 'wisata',
                'category' => 'wisata',
            ],
        ]);

        UserNotification::create([
            'user_id' => $request->user()->id,
            'title' => 'Menunggu pembayaran tiket',
            'message' => 'Ada pembayaran tiket wisata yang perlu diselesaikan.',
            'type' => 'wisata_payment_pending',
            'data' => [
                'booking_id' => $this->encryptId($booking->id),
                'type' => 'wisata',
                'category' => 'wisata',
            ],
        ]);

        $booking->load(['ticket', 'destination', 'payments']);

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

        $booking->load(['ticket', 'destination', 'payments']);

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

        if ($booking->isExpired()) {
            $booking->update(['status' => 'expired', 'payment_status' => 'expired']);
            return response()->json(['message' => 'Booking sudah kedaluwarsa.'], 422);
        }

        if ($booking->status !== 'pending_payment') {
            $booking->load(['ticket', 'destination', 'payments']);

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

        $orderId = sprintf('WISATA-%s-%s', $booking->id, now()->format('YmdHis'));
        $payload = $this->buildSnapPayload($booking, $orderId);

        try {
            $charge = $midtransService->snap($payload);
        } catch (\Throwable $exception) {
            return response()->json(['message' => 'Gagal menghubungi server pembayaran. Silakan coba lagi.'], 500);
        }

        $payment = WisataPayment::create([
            'wisata_booking_id' => $booking->id,
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
            'cancel_reason' => $request->string('reason')->toString() ?: null,
            'cancelled_at' => now(),
        ]);

        UserNotification::create([
            'user_id' => $booking->user_id,
            'title' => 'Pesanan dibatalkan',
            'message' => 'Pesanan kamu berhasil dibatalkan.',
            'type' => 'wisata_booking_cancelled',
            'data' => [
                'booking_id' => $this->encryptId($booking->id),
                'type' => 'wisata',
                'category' => 'wisata',
            ],
        ]);

        $booking->load(['ticket', 'destination', 'payments']);

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

        $booking->load('ticket', 'destination');

        $filename = sprintf('tiket-wisata-%s.pdf', $booking->id);
        $cacheAllowed = in_array($booking->status, ['paid', 'completed'], true);

        $qrImage = null;
        if ($cacheAllowed) {
            $qrUrl = $this->buildQrUrl('WISATA', (string) $booking->booking_code);
            $context = stream_context_create(['http' => ['timeout' => 4]]);
            $contents = @file_get_contents($qrUrl, false, $context);
            if ($contents !== false) {
                $qrImage = 'data:image/png;base64,'.base64_encode($contents);
            }
        }

        return Pdf::view('wisata-ticket', [
            'booking' => $booking,
            'qrImage' => $qrImage,
        ])->download($filename);
    }

    private function bookingPayload(WisataBooking $booking): array
    {
        $latestPayment = $booking->payments()->latest()->first();

        return [
            'id' => $booking->id,
            'encrypted_id' => $this->encryptId($booking->id),
            'booking_code' => $booking->booking_code,
            'visit_date' => $booking->visit_date?->toDateString(),
            'quantity' => $booking->quantity,
            'unit_price' => $booking->unit_price,
            'total' => $booking->total_price,
            'status' => $booking->status,
            'payment_status' => $booking->payment_status,
            'payment_deadline' => $booking->payment_deadline?->toIso8601String(),
            'ticket' => [
                'id' => $booking->ticket?->id,
                'name' => $booking->ticket?->name,
            ],
            'destination' => [
                'id' => $booking->destination?->id,
                'slug' => $booking->destination?->slug,
                'name' => $booking->destination?->destination_name,
                'address' => $booking->destination?->address_full,
            ],
            'guest' => [
                'name' => $booking->guest_name,
                'email' => $booking->guest_email,
                'phone' => $booking->guest_phone,
            ],
            'payment' => $latestPayment ? [
                'status' => $latestPayment->status,
                'payment_type' => $latestPayment->payment_type,
                'payload' => $latestPayment->payload,
            ] : null,
            'qr_data' => $this->buildQrData('WISATA', (string) $booking->booking_code),
            'qr_url' => $this->buildQrUrl('WISATA', (string) $booking->booking_code),
        ];
    }

    private function availableTickets(WisataTicket $ticket, string $date, bool $lock = false): int
    {
        $query = WisataBooking::query()
            ->where('wisata_ticket_id', $ticket->id)
            ->whereDate('visit_date', $date)
            ->whereIn('status', ['pending_payment', 'paid', 'completed']);

        if ($lock) {
            $query->lockForUpdate();
        }

        $reserved = (int) $query->sum('quantity');
        $maxQuota = $ticket->daily_quota ?? $ticket->quota;

        return max(0, (int) $maxQuota - $reserved);
    }

    private function buildSnapPayload(WisataBooking $booking, string $orderId): array
    {
        return [
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => (int) $booking->total_price,
            ],
            'item_details' => [
                [
                    'id' => (string) $booking->ticket?->id,
                    'price' => (int) $booking->unit_price,
                    'quantity' => (int) $booking->quantity,
                    'name' => $booking->ticket?->name ?? 'Tiket Wisata',
                ],
            ],
            'customer_details' => [
                'first_name' => $booking->guest_name,
                'email' => $booking->guest_email,
                'phone' => $booking->guest_phone,
            ],
        ];
    }

    private function resolveBooking(string $booking): WisataBooking
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

        return WisataBooking::query()->findOrFail($id);
    }

    private function encryptId(int $id): string
    {
        return Crypt::encryptString((string) $id);
    }

    private function attachAffiliateCommission(WisataBooking $booking, ?WisataAffiliateLink $link): void
    {
        if (! $link) {
            return;
        }

        $affiliate = WisataAffiliate::query()->find($link->affiliate_id);
        if (! $affiliate || $affiliate->status !== 'active') {
            return;
        }

        if ($affiliate->wisata_id && (int) $affiliate->wisata_id !== (int) $booking->mitra_wisata_onboarding_id) {
            return;
        }

        $commission = $this->resolveCommissionRule((int) $booking->mitra_wisata_onboarding_id);
        if (! $commission) {
            return;
        }

        $amount = $this->calculateCommissionAmount($commission, $booking);
        if ($amount <= 0) {
            return;
        }

        WisataAffiliateCommissionItem::create([
            'affiliate_id' => $affiliate->id,
            'wisata_booking_id' => $booking->id,
            'commission_amount' => $amount,
            'status' => 'pending',
        ]);

        if ($affiliate->user_id) {
            UserNotification::create([
                'user_id' => $affiliate->user_id,
                'title' => 'Komisi baru menunggu pembayaran',
                'message' => 'Ada komisi baru dari tiket wisata yang menunggu pembayaran berhasil.',
                'type' => 'affiliate_commission_pending',
                'data' => [
                    'booking_id' => $this->encryptId($booking->id),
                    'category' => 'affiliate',
                ],
            ]);
        }
    }

    private function resolveAffiliateLinkFromCode(?string $code): ?WisataAffiliateLink
    {
        if (! $code) {
            return null;
        }

        return WisataAffiliateLink::query()
            ->where('code', strtoupper(trim($code)))
            ->where('status', 'active')
            ->first();
    }

    private function resolveCommissionRule(int $destinationId): ?WisataAffiliateCommission
    {
        $today = now()->toDateString();

        $commission = WisataAffiliateCommission::query()
            ->where('scope_type', 'wisata')
            ->where('wisata_id', $destinationId)
            ->where(function ($query) use ($today) {
                $query->whereNull('start_date')->orWhere('start_date', '<=', $today);
            })
            ->where(function ($query) use ($today) {
                $query->whereNull('end_date')->orWhere('end_date', '>=', $today);
            })
            ->latest('id')
            ->first();

        if ($commission) {
            return $commission;
        }

        return WisataAffiliateCommission::query()
            ->where('scope_type', 'global')
            ->where(function ($query) use ($today) {
                $query->whereNull('start_date')->orWhere('start_date', '<=', $today);
            })
            ->where(function ($query) use ($today) {
                $query->whereNull('end_date')->orWhere('end_date', '>=', $today);
            })
            ->latest('id')
            ->first();
    }

    private function calculateCommissionAmount(WisataAffiliateCommission $commission, WisataBooking $booking): int
    {
        if ($commission->type === 'percentage') {
            return (int) round($booking->total_price * ($commission->value / 100));
        }

        return (int) $commission->value * max(1, (int) $booking->quantity);
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
