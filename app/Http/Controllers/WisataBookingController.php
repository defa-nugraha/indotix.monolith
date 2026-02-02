<?php

namespace App\Http\Controllers;

use App\Models\MitraWisataOnboarding;
use App\Models\UserNotification;
use App\Models\WisataBooking;
use App\Models\WisataPayment;
use App\Models\WisataTicket;
use App\Services\MidtransService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class WisataBookingController extends Controller
{
    private const PAYMENT_TTL_MINUTES = 15;

    public function prepare(Request $request): RedirectResponse
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
            return back()->withErrors(['destination_id' => 'Destinasi sedang tutup sementara.']);
        }

        $ticket = WisataTicket::query()->where('id', $data['ticket_id'])->firstOrFail();
        if ((int) $ticket->mitra_wisata_onboarding_id !== (int) $destination->id) {
            return back()->withErrors(['ticket_id' => 'Tiket tidak sesuai destinasi.']);
        }

        if (! $ticket->is_active || $ticket->is_closed) {
            return back()->withErrors(['ticket_id' => 'Tiket belum tersedia.']);
        }

        if ($this->availableTickets($ticket, $data['visit_date']) < (int) $data['quantity']) {
            return back()->withErrors(['quantity' => 'Kuota tiket tidak mencukupi.']);
        }

        $draft = [
            'destination_id' => (int) $destination->id,
            'ticket_id' => (int) $ticket->id,
            'visit_date' => $data['visit_date'],
            'quantity' => (int) $data['quantity'],
        ];

        $request->session()->put('wisata_booking_draft', $draft);

        if (! $request->user()) {
            return redirect()->route('login');
        }

        if ($request->user()->role !== 'user') {
            return redirect()->route('home');
        }

        return redirect()->route('wisata.booking.review');
    }

    public function review(Request $request): Response|RedirectResponse
    {
        $draft = $request->session()->get('wisata_booking_draft');
        if (! $draft) {
            return redirect()->route('wisata.search')->withErrors(['booking' => 'Data pemesanan tidak ditemukan.']);
        }

        $destination = MitraWisataOnboarding::query()->findOrFail($draft['destination_id']);
        $ticket = WisataTicket::query()->findOrFail($draft['ticket_id']);

        $total = (int) $ticket->price * (int) $draft['quantity'];

        return Inertia::render('public/wisata/booking/review', [
            'draft' => $draft,
            'destination' => [
                'id' => $destination->id,
                'destination_name' => $destination->destination_name,
                'city_name' => $this->resolveCityName($destination->city_code),
                'address_full' => $destination->address_full,
            ],
            'ticket' => [
                'id' => $ticket->id,
                'name' => $ticket->name,
                'price' => $ticket->price,
            ],
            'pricing' => [
                'total' => $total,
            ],
        ]);
    }

    public function confirm(Request $request): RedirectResponse
    {
        $draft = $request->session()->get('wisata_booking_draft');
        if (! $draft) {
            return redirect()->route('wisata.search')->withErrors(['booking' => 'Data pemesanan tidak ditemukan.']);
        }

        $data = $request->validate([
            'guest_name' => ['required', 'string', 'max:255'],
            'guest_email' => ['required', 'email', 'max:255'],
            'guest_phone' => ['required', 'string', 'max:30'],
            'special_request' => ['nullable', 'string', 'max:1000'],
        ]);

        $booking = DB::transaction(function () use ($draft, $data, $request) {
            $ticket = WisataTicket::query()->lockForUpdate()->findOrFail($draft['ticket_id']);
            $available = $this->availableTickets($ticket, $draft['visit_date'], true);
            if ($available < (int) $draft['quantity']) {
                throw new RuntimeException('Kuota tiket sudah habis.');
            }

            $order = WisataBooking::create([
                'user_id' => $request->user()->id,
                'mitra_wisata_onboarding_id' => $draft['destination_id'],
                'wisata_ticket_id' => $ticket->id,
                'booking_code' => strtoupper('WISATA-'.$request->user()->id.'-'.now()->format('ymdHis')),
                'visit_date' => $draft['visit_date'],
                'quantity' => $draft['quantity'],
                'unit_price' => $ticket->price,
                'total_price' => $ticket->price * $draft['quantity'],
                'status' => 'pending_payment',
                'payment_status' => 'pending',
                'payment_deadline' => now()->addMinutes(self::PAYMENT_TTL_MINUTES),
                'guest_name' => $data['guest_name'],
                'guest_email' => $data['guest_email'],
                'guest_phone' => $data['guest_phone'],
                'special_request' => $data['special_request'] ?? null,
            ]);

            return $order;
        });

        UserNotification::create([
            'user_id' => $request->user()->id,
            'title' => 'Pemesanan tiket berhasil',
            'message' => 'Pesanan tiket wisata sudah dibuat. Silakan lanjutkan pembayaran.',
            'type' => 'wisata_booking_created',
            'data' => [
                'booking_id' => $this->encryptId($booking->id),
                'type' => 'wisata',
            ],
        ]);

        $request->session()->forget('wisata_booking_draft');

        return redirect()->route('wisata.booking.payment', ['booking' => $this->encryptId($booking->id)]);
    }

    public function payment(Request $request, string $booking): Response|RedirectResponse
    {
        $booking = $this->resolveBooking($booking);

        if ((int) $booking->user_id !== (int) $request->user()->id) {
            return redirect()->route('home');
        }

        if ($booking->isExpired()) {
            $booking->update([
                'status' => 'expired',
                'payment_status' => 'expired',
            ]);
        }

        $booking->load('ticket', 'payments');

        return Inertia::render('public/wisata/booking/payment', [
            'booking' => $this->bookingPayload($booking),
            'paymentOptions' => [
                ['id' => 'bca_va', 'label' => 'BCA Virtual Account'],
                ['id' => 'bni_va', 'label' => 'BNI Virtual Account'],
                ['id' => 'bri_va', 'label' => 'BRI Virtual Account'],
                ['id' => 'mandiri_va', 'label' => 'Mandiri Virtual Account'],
                ['id' => 'gopay', 'label' => 'GoPay'],
                ['id' => 'qris', 'label' => 'QRIS'],
            ],
        ]);
    }

    public function pay(Request $request, string $booking, MidtransService $midtransService): RedirectResponse
    {
        $booking = $this->resolveBooking($booking);

        if ((int) $booking->user_id !== (int) $request->user()->id) {
            return redirect()->route('home');
        }

        if ($booking->isExpired()) {
            $booking->update(['status' => 'expired', 'payment_status' => 'expired']);
            return redirect()->route('wisata.booking.payment', ['booking' => $this->encryptId($booking->id)])
                ->withErrors(['payment' => 'Booking sudah kedaluwarsa.']);
        }

        $data = $request->validate([
            'payment_type' => ['required', 'string'],
        ]);

        if ($booking->status !== 'pending_payment') {
            return redirect()->route('wisata.booking.payment', ['booking' => $this->encryptId($booking->id)]);
        }

        if ($booking->payments()->where('status', 'pending')->exists()) {
            return redirect()->route('wisata.booking.payment', ['booking' => $this->encryptId($booking->id)])
                ->withErrors(['payment' => 'Pembayaran sedang diproses.']);
        }

        $orderId = sprintf('WISATA-%s-%s', $booking->id, now()->format('YmdHis'));
        $payload = $this->buildChargePayload($booking, $data['payment_type'], $orderId);

        try {
            $charge = $midtransService->charge($payload);
        } catch (\Throwable $exception) {
            return redirect()->route('wisata.booking.payment', ['booking' => $this->encryptId($booking->id)])
                ->withErrors(['payment' => 'Gagal menghubungi server pembayaran. Silakan coba lagi.']);
        }

        $payment = WisataPayment::create([
            'wisata_booking_id' => $booking->id,
            'provider' => 'midtrans',
            'status' => $charge['transaction_status'] ?? 'pending',
            'gross_amount' => (int) $booking->total_price,
            'payment_type' => $charge['payment_type'] ?? $data['payment_type'],
            'transaction_id' => $charge['transaction_id'] ?? null,
            'order_id' => $orderId,
            'payload' => $charge,
        ]);

        $booking->update([
            'midtrans_order_id' => $payment->order_id,
            'payment_status' => $payment->status,
        ]);

        return redirect()->route('wisata.booking.payment', ['booking' => $this->encryptId($booking->id)]);
    }

    public function show(Request $request, string $booking): Response|RedirectResponse
    {
        $booking = $this->resolveBooking($booking);

        if ((int) $booking->user_id !== (int) $request->user()->id) {
            return redirect()->route('home');
        }

        $booking->load('ticket');

        return Inertia::render('public/wisata/booking/show', [
            'booking' => $this->bookingPayload($booking),
        ]);
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

    private function bookingPayload(WisataBooking $booking): array
    {
        $latestPayment = $booking->payments()->latest()->first();

        return [
            'id' => $booking->id,
            'encrypted_id' => $this->encryptId($booking->id),
            'booking_code' => $booking->booking_code,
            'visit_date' => $booking->visit_date->toDateString(),
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
        ];
    }

    private function buildChargePayload(WisataBooking $booking, string $paymentType, string $orderId): array
    {
        $payload = [
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

        if (str_ends_with($paymentType, '_va')) {
            $bank = str_replace('_va', '', $paymentType);
            $payload['payment_type'] = 'bank_transfer';
            $payload['bank_transfer'] = [
                'bank' => $bank,
            ];

            return $payload;
        }

        $payload['payment_type'] = $paymentType;

        return $payload;
    }

    private function resolveBooking(string $booking): WisataBooking
    {
        try {
            $id = Crypt::decryptString($booking);
        } catch (\Throwable $exception) {
            abort(404);
        }

        return WisataBooking::query()->findOrFail($id);
    }

    private function encryptId(int $id): string
    {
        return Crypt::encryptString((string) $id);
    }

    private function resolveCityName(?string $cityCode): ?string
    {
        if (! $cityCode) {
            return null;
        }

        return DB::table('regencies')->where('code', $cityCode)->value('name');
    }
}
