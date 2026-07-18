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
use App\Models\WisataBookingItem;
use App\Services\MidtransService;
use App\Services\ProductReviewService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\LaravelPdf\Facades\Pdf;

class WisataBookingController extends Controller
{
    private const PAYMENT_TTL_MINUTES = 15;
    private const MAX_TICKETS_PER_BOOKING = 20;

    public function prepare(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'destination_id' => ['required', 'integer', 'exists:mitra_wisata_onboardings,id'],
            'ticket_id' => ['nullable', 'integer', 'exists:wisata_tickets,id'],
            'visit_date' => ['required', 'date'],
            'quantity' => ['nullable', 'integer', 'min:1', 'max:'.self::MAX_TICKETS_PER_BOOKING],
            'items' => ['nullable', 'array'],
            'items.*.ticket_id' => ['required_with:items', 'integer', 'exists:wisata_tickets,id'],
            'items.*.quantity' => ['required_with:items', 'integer', 'min:0', 'max:'.self::MAX_TICKETS_PER_BOOKING],
        ]);

        $destination = MitraWisataOnboarding::query()
            ->publiclyVisible()
            ->where('id', $data['destination_id'])
            ->firstOrFail();

        try {
            $selections = $this->normalizeTicketSelections($data);
            $summary = $this->buildDraftSummary([
                'destination_id' => (int) $destination->id,
                'visit_date' => $data['visit_date'],
                'items' => $selections,
            ], $destination);
        } catch (ValidationException $exception) {
            return back()->withErrors($exception->errors());
        }

        $draft = [
            'destination_id' => (int) $destination->id,
            'ticket_id' => (int) $summary['items'][0]['ticket_id'],
            'visit_date' => $data['visit_date'],
            'quantity' => (int) $summary['quantity'],
            'items' => $selections,
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

        try {
            return $this->reviewResponse($draft);
        } catch (ValidationException $exception) {
            return redirect()->route('wisata.search')->withErrors($exception->errors());
        }
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

                $snap = $this->createSnapPayment($existingBooking, $midtransService);

                return $this->reviewResponse($draft, [
                    'snapToken' => $snap['token'] ?? null,
                ]);
            }
        }

        $booking = DB::transaction(function () use ($draft, $data, $request) {
            $destination = MitraWisataOnboarding::query()
                ->publiclyVisible()
                ->lockForUpdate()
                ->findOrFail($draft['destination_id']);
            $summary = $this->buildDraftSummary($draft, $destination, true);
            $primaryItem = $summary['items'][0];

            $order = WisataBooking::create([
                'user_id' => $request->user()->id,
                'mitra_wisata_onboarding_id' => $draft['destination_id'],
                'wisata_ticket_id' => $primaryItem['ticket_id'],
                'booking_code' => strtoupper('WISATA-'.$request->user()->id.'-'.now()->format('ymdHis')),
                'visit_date' => $draft['visit_date'],
                'quantity' => $summary['quantity'],
                'unit_price' => $primaryItem['unit_price'],
                'total_price' => $summary['total'],
                'status' => 'pending_payment',
                'payment_status' => 'pending',
                'payment_deadline' => now()->addMinutes(self::PAYMENT_TTL_MINUTES),
                'guest_name' => $data['guest_name'],
                'guest_email' => $data['guest_email'],
                'guest_phone' => $data['guest_phone'],
                'special_request' => $data['special_request'] ?? null,
            ]);

            $order->items()->createMany(array_map(fn (array $item) => [
                'wisata_ticket_id' => $item['ticket_id'],
                'ticket_name' => $item['name'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'subtotal' => $item['subtotal'],
            ], $summary['items']));

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

        $snap = $this->createSnapPayment($booking, $midtransService);

        return $this->reviewResponse($draft, [
            'snapToken' => $snap['token'] ?? null,
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

        $booking->load('ticket', 'items.ticket', 'payments');

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

        $booking->load('ticket', 'destination', 'items.ticket');

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

        $booking->load('ticket', 'destination', 'items.ticket');

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

    private function normalizeTicketSelections(array $data): array
    {
        $rawItems = collect($data['items'] ?? [])
            ->map(fn ($item) => [
                'ticket_id' => (int) ($item['ticket_id'] ?? 0),
                'quantity' => (int) ($item['quantity'] ?? 0),
            ])
            ->filter(fn ($item) => $item['ticket_id'] > 0 && $item['quantity'] > 0)
            ->values();

        if ($rawItems->isEmpty() && ! empty($data['ticket_id']) && ! empty($data['quantity'])) {
            $rawItems = collect([[
                'ticket_id' => (int) $data['ticket_id'],
                'quantity' => (int) $data['quantity'],
            ]]);
        }

        $items = $rawItems
            ->groupBy('ticket_id')
            ->map(fn ($rows, $ticketId) => [
                'ticket_id' => (int) $ticketId,
                'quantity' => (int) $rows->sum('quantity'),
            ])
            ->values()
            ->all();

        $totalQuantity = array_sum(array_column($items, 'quantity'));

        if ($totalQuantity < 1) {
            throw ValidationException::withMessages([
                'items' => 'Pilih minimal satu tiket.',
            ]);
        }

        if ($totalQuantity > self::MAX_TICKETS_PER_BOOKING) {
            throw ValidationException::withMessages([
                'items' => 'Jumlah tiket maksimal '.self::MAX_TICKETS_PER_BOOKING.' per pemesanan.',
            ]);
        }

        return $items;
    }

    private function buildDraftSummary(array $draft, ?MitraWisataOnboarding $destination = null, bool $lock = false): array
    {
        $destination ??= MitraWisataOnboarding::query()
            ->publiclyVisible()
            ->findOrFail($draft['destination_id']);

        $selections = $this->normalizeTicketSelections($draft);
        $ticketIds = array_column($selections, 'ticket_id');
        $ticketQuery = WisataTicket::query()->whereIn('id', $ticketIds);

        if ($lock) {
            $ticketQuery->lockForUpdate();
        }

        $tickets = $ticketQuery->get()->keyBy('id');
        $items = [];

        foreach ($selections as $selection) {
            /** @var WisataTicket|null $ticket */
            $ticket = $tickets->get($selection['ticket_id']);

            if (! $ticket || (int) $ticket->mitra_wisata_onboarding_id !== (int) $destination->id) {
                throw ValidationException::withMessages([
                    'items' => 'Tiket tidak sesuai destinasi.',
                ]);
            }

            if (! $ticket->is_active || $ticket->is_closed) {
                throw ValidationException::withMessages([
                    'items' => "Tiket {$ticket->name} belum tersedia.",
                ]);
            }

            $available = $this->availableTickets($ticket, $draft['visit_date'], $lock);
            if ($available < (int) $selection['quantity']) {
                throw ValidationException::withMessages([
                    'items' => "Kuota {$ticket->name} tersisa {$available}.",
                ]);
            }

            $unitPrice = (int) $ticket->price;
            $quantity = (int) $selection['quantity'];

            $items[] = [
                'ticket_id' => (int) $ticket->id,
                'name' => $ticket->name,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'subtotal' => $unitPrice * $quantity,
                'available' => $available,
            ];
        }

        return [
            'destination' => $destination,
            'items' => $items,
            'quantity' => array_sum(array_column($items, 'quantity')),
            'total' => array_sum(array_column($items, 'subtotal')),
        ];
    }

    private function reviewResponse(array $draft, array $extra = []): Response
    {
        $summary = $this->buildDraftSummary($draft);
        $destination = $summary['destination'];
        $primaryItem = $summary['items'][0];

        return Inertia::render('public/wisata/booking/review', array_merge([
            'draft' => [
                'destination_id' => (int) $destination->id,
                'ticket_id' => (int) $primaryItem['ticket_id'],
                'visit_date' => $draft['visit_date'],
                'quantity' => (int) $summary['quantity'],
                'items' => array_map(fn (array $item) => [
                    'ticket_id' => (int) $item['ticket_id'],
                    'quantity' => (int) $item['quantity'],
                ], $summary['items']),
            ],
            'destination' => [
                'id' => $destination->id,
                'destination_name' => $destination->destination_name,
                'city_name' => $this->resolveCityName($destination->city_code),
                'address_full' => $destination->address_full,
            ],
            'ticket' => [
                'id' => $primaryItem['ticket_id'],
                'name' => $primaryItem['name'],
                'price' => $primaryItem['unit_price'],
            ],
            'items' => $summary['items'],
            'pricing' => [
                'total' => $summary['total'],
                'quantity' => $summary['quantity'],
            ],
            'snapClientKey' => (string) config('services.midtrans.client_key', ''),
            'snapScriptUrl' => config('services.midtrans.is_production')
                ? 'https://app.midtrans.com/snap/snap.js'
                : 'https://app.sandbox.midtrans.com/snap/snap.js',
        ], $extra));
    }

    private function availableTickets(WisataTicket $ticket, string $date, bool $lock = false): int
    {
        $itemQuery = WisataBookingItem::query()
            ->where('wisata_ticket_id', $ticket->id)
            ->whereHas('booking', function ($query) use ($date) {
                $query
                    ->whereDate('visit_date', $date)
                    ->whereIn('status', ['pending_payment', 'paid', 'completed']);
            });

        $legacyQuery = WisataBooking::query()
            ->where('wisata_ticket_id', $ticket->id)
            ->whereDate('visit_date', $date)
            ->whereIn('status', ['pending_payment', 'paid', 'completed'])
            ->whereDoesntHave('items');

        if ($lock) {
            $itemQuery->lockForUpdate();
            $legacyQuery->lockForUpdate();
        }

        $reserved = (int) $itemQuery->sum('quantity') + (int) $legacyQuery->sum('quantity');
        $maxQuota = $ticket->daily_quota ?? $ticket->quota;

        return max(0, (int) $maxQuota - $reserved);
    }

    private function bookingLineItems(WisataBooking $booking): array
    {
        $booking->loadMissing('ticket', 'items.ticket');

        if ($booking->items->isNotEmpty()) {
            return $booking->items
                ->map(fn (WisataBookingItem $item) => [
                    'ticket_id' => (int) $item->wisata_ticket_id,
                    'name' => $item->ticket_name ?? $item->ticket?->name ?? 'Tiket Wisata',
                    'quantity' => (int) $item->quantity,
                    'unit_price' => (int) $item->unit_price,
                    'subtotal' => (int) $item->subtotal,
                ])
                ->values()
                ->all();
        }

        return [[
            'ticket_id' => (int) $booking->wisata_ticket_id,
            'name' => $booking->ticket?->name ?? 'Tiket Wisata',
            'quantity' => (int) $booking->quantity,
            'unit_price' => (int) $booking->unit_price,
            'subtotal' => (int) $booking->total_price,
        ]];
    }

    private function bookingPayload(WisataBooking $booking): array
    {
        $latestPayment = $booking->payments()->latest()->first();
        $items = $this->bookingLineItems($booking);

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
            'items' => $items,
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
        $items = $this->bookingLineItems($booking);

        return [
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => (int) $booking->total_price,
            ],
            'item_details' => array_map(fn (array $item) => [
                'id' => (string) $item['ticket_id'],
                'price' => (int) $item['unit_price'],
                'quantity' => (int) $item['quantity'],
                'name' => $item['name'] ?: 'Tiket Wisata',
            ], $items),
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
