<?php

namespace App\Http\Controllers;

use App\Models\MitraWisataOnboarding;
use App\Models\UserNotification;
use App\Models\WisataBooking;
use App\Models\WisataAffiliate;
use App\Models\WisataAffiliateCommission;
use App\Models\WisataAffiliateCommissionItem;
use App\Models\WisataAffiliateLink;
use App\Models\WisataPayment;
use App\Models\WisataTicket;
use App\Services\MidtransService;
use App\Services\ProductReviewService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Spatie\LaravelPdf\Facades\Pdf;

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
            'snapClientKey' => (string) config('services.midtrans.client_key', ''),
            'snapScriptUrl' => config('services.midtrans.is_production')
                ? 'https://app.midtrans.com/snap/snap.js'
                : 'https://app.sandbox.midtrans.com/snap/snap.js',
        ]);
    }

    public function confirm(Request $request, MidtransService $midtransService): RedirectResponse|\Illuminate\Http\JsonResponse|\Inertia\Response
    {
        $draft = $request->session()->get('wisata_booking_draft');
        if (! $draft) {
            return redirect()->route('wisata.search')->withErrors(['booking' => 'Data pemesanan tidak ditemukan.']);
        }

        $data = $request->validate([
            'guest_name' => ['required', 'string', 'max:255'],
            'guest_email' => ['required', 'email', 'max:255'],
            'special_request' => ['nullable', 'string', 'max:1000'],
        ]);

        $profilePhone = $request->user()?->phone;
        if (! $profilePhone) {
            return back()->withErrors(['guest_phone' => 'Nomor HP belum diisi di profil.']);
        }
        $data['guest_phone'] = $profilePhone;

        $existingBookingId = $request->session()->get('wisata_booking_pending');
        if ($existingBookingId) {
            $existingBooking = WisataBooking::query()->find($existingBookingId);
            if ($existingBooking) {
                if ($request->expectsJson()) {
                    $snap = $this->createSnapPayment($existingBooking, $midtransService);

                    return response()->json([
                        'booking_id' => $this->encryptId($existingBooking->id),
                        'snap_token' => $snap['token'] ?? null,
                        'redirect_url' => $snap['redirect_url'] ?? null,
                    ]);
                }

                $destination = MitraWisataOnboarding::query()->findOrFail($draft['destination_id']);
                $ticket = WisataTicket::query()->findOrFail($draft['ticket_id']);
                $total = (int) $ticket->price * (int) $draft['quantity'];
                $snap = $this->createSnapPayment($existingBooking, $midtransService);

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
                    'snapToken' => $snap['token'] ?? null,
                    'snapClientKey' => (string) config('services.midtrans.client_key', ''),
                    'snapScriptUrl' => config('services.midtrans.is_production')
                        ? 'https://app.midtrans.com/snap/snap.js'
                        : 'https://app.sandbox.midtrans.com/snap/snap.js',
                ]);
            }
        }

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

            $this->attachAffiliateCommission($order, $request);

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

        $request->session()->forget('wisata_booking_draft');
        $request->session()->put('wisata_booking_pending', $booking->id);

        if ($request->expectsJson()) {
            try {
                $snap = $this->createSnapPayment($booking, $midtransService);
            } catch (\Throwable $exception) {
                return response()->json([
                    'message' => 'Gagal menghubungi server pembayaran. Silakan coba lagi.',
                ], 422);
            }

            return response()->json([
                'booking_id' => $this->encryptId($booking->id),
                'snap_token' => $snap['token'] ?? null,
                'redirect_url' => $snap['redirect_url'] ?? null,
            ]);
        }

        $destination = MitraWisataOnboarding::query()->findOrFail($draft['destination_id']);
        $ticket = WisataTicket::query()->findOrFail($draft['ticket_id']);
        $total = (int) $ticket->price * (int) $draft['quantity'];
        $snap = $this->createSnapPayment($booking, $midtransService);

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
            'snapToken' => $snap['token'] ?? null,
            'snapClientKey' => (string) config('services.midtrans.client_key', ''),
            'snapScriptUrl' => config('services.midtrans.is_production')
                ? 'https://app.midtrans.com/snap/snap.js'
                : 'https://app.sandbox.midtrans.com/snap/snap.js',
        ]);
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
            'snapClientKey' => (string) config('services.midtrans.client_key', ''),
            'snapScriptUrl' => config('services.midtrans.is_production')
                ? 'https://app.midtrans.com/snap/snap.js'
                : 'https://app.sandbox.midtrans.com/snap/snap.js',
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

        if ($booking->status !== 'pending_payment') {
            return redirect()->route('wisata.booking.payment', ['booking' => $this->encryptId($booking->id)]);
        }

        if ($booking->payments()->where('status', 'pending')->exists()) {
            return redirect()->route('wisata.booking.payment', ['booking' => $this->encryptId($booking->id)]);
        }

        $orderId = sprintf('WISATA-%s-%s', $booking->id, now()->format('YmdHis'));
        $payload = $this->buildSnapPayload($booking, $orderId);

        try {
            $charge = $midtransService->snap($payload);
        } catch (\Throwable $exception) {
            return redirect()->route('wisata.booking.payment', ['booking' => $this->encryptId($booking->id)])
                ->withErrors(['payment' => 'Gagal menghubungi server pembayaran. Silakan coba lagi.']);
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

        return redirect()->route('wisata.booking.payment', ['booking' => $this->encryptId($booking->id)]);
    }

    public function show(Request $request, string $booking): Response|RedirectResponse
    {
        $booking = $this->resolveBooking($booking);

        if ((int) $booking->user_id !== (int) $request->user()->id) {
            return redirect()->route('home');
        }

        $booking->load('ticket', 'destination');

        $reviewUrl = $booking->mitra_wisata_onboarding_id
            ? '/wisata/'.$booking->destination?->slug
            : null;

        return Inertia::render('public/wisata/booking/show', [
            'booking' => array_merge($this->bookingPayload($booking), [
                'review' => [
                    'can_review' => ProductReviewService::hasUsedBooking($request->user()->id, 'wisata', (int) $booking->mitra_wisata_onboarding_id),
                    'url' => $reviewUrl,
                ],
            ]),
        ]);
    }

    public function ticket(Request $request, string $booking)
    {
        $booking = $this->resolveBooking($booking);

        if ((int) $booking->user_id !== (int) $request->user()->id) {
            return redirect()->route('home');
        }

        $booking->load('ticket', 'destination');

        $filename = sprintf('tiket-wisata-%s.pdf', $booking->id);
        $cacheAllowed = in_array($booking->status, ['paid', 'completed'], true);

        $qrImage = null;
        if ($cacheAllowed) {
            $qrUrl = $this->buildQrUrl('WISATA', $booking->booking_code);
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
            'qr_data' => $this->buildQrData('WISATA', $booking->booking_code),
            'qr_url' => $this->buildQrUrl('WISATA', $booking->booking_code),
        ];
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

    private function createSnapPayment(WisataBooking $booking, MidtransService $midtransService): array
    {
        if ($booking->payments()->where('status', 'pending')->exists()) {
            return (array) ($booking->payments()->latest()->value('payload') ?? []);
        }

        $orderId = sprintf('WISATA-%s-%s', $booking->id, now()->format('YmdHis'));
        $payload = $this->buildSnapPayload($booking, $orderId);

        $snap = $midtransService->snap($payload);

        $payment = WisataPayment::create([
            'wisata_booking_id' => $booking->id,
            'provider' => 'midtrans',
            'status' => 'pending',
            'gross_amount' => (int) $booking->total_price,
            'payment_type' => 'snap',
            'transaction_id' => $snap['transaction_id'] ?? null,
            'order_id' => $orderId,
            'payload' => $snap,
        ]);

        $booking->update([
            'midtrans_order_id' => $payment->order_id,
            'payment_status' => $payment->status,
        ]);

        return $snap;
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

    private function attachAffiliateCommission(WisataBooking $booking, Request $request): void
    {
        $link = $this->resolveAffiliateLink($request);
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

    private function resolveAffiliateLink(Request $request): ?WisataAffiliateLink
    {
        $payload = $request->session()->get('affiliate_ref');
        if (! $payload) {
            $cookie = $request->cookie('affiliate_ref');
            if ($cookie) {
                $payload = json_decode($cookie, true);
            }
        }

        if (! is_array($payload) || empty($payload['link_id'])) {
            return null;
        }

        return WisataAffiliateLink::query()
            ->where('id', $payload['link_id'])
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
