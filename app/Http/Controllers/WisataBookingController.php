<?php

namespace App\Http\Controllers;

use App\Mail\WisataTicketMail;
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
use App\Models\Voucher;
use App\Services\MidtransService;
use App\Services\ProductReviewService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
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

        $pendingVoucherCode = $request->session()->get('pending_voucher_code');
        if ($pendingVoucherCode) {
            $voucher = $this->resolveVoucher($pendingVoucherCode, false, (int) $destination->id);
            $userId = (int) ($request->user()?->id ?? 0);

            if (
                $voucher
                && ((int) ($voucher->min_transaction ?? 0) <= 0 || (int) $summary['total'] >= (int) $voucher->min_transaction)
                && ($userId === 0 || $this->canUseVoucherForUser($voucher, $userId))
            ) {
                $draft['voucher_code'] = $voucher->code;
                $request->session()->forget('pending_voucher_code');
            }
        }

        $request->session()->put('wisata_booking_draft', $draft);

        if (! $request->user()) {
            $request->session()->put('url.intended', route('wisata.booking.review'));

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
            return $this->reviewResponse($draft, [], $request);
        } catch (ValidationException $exception) {
            return redirect()->route('wisata.search')->withErrors($exception->errors());
        }
    }

    public function applyVoucher(Request $request): RedirectResponse
    {
        $draft = $request->session()->get('wisata_booking_draft');
        if (! $draft) {
            return redirect()->route('wisata.search')->withErrors(['voucher_code' => 'Data pemesanan tidak ditemukan.']);
        }

        $data = $request->validate([
            'voucher_code' => ['required', 'string', 'max:50'],
        ]);

        $summary = $this->buildDraftSummary($draft);
        $voucher = $this->resolveVoucher($data['voucher_code'], false, (int) $summary['destination']->id);
        if (! $voucher) {
            return back()->withErrors(['voucher_code' => 'Voucher tidak valid untuk destinasi ini atau sudah habis.']);
        }

        if ($voucher->min_transaction > 0 && $summary['total'] < $voucher->min_transaction) {
            return back()->withErrors(['voucher_code' => 'Minimum transaksi belum memenuhi syarat voucher.']);
        }

        if (! $this->canUseVoucherForUser($voucher, (int) $request->user()->id)) {
            return back()->withErrors(['voucher_code' => 'Voucher sudah mencapai limit penggunaan untuk akun ini.']);
        }

        $draft['voucher_code'] = $voucher->code;
        $request->session()->put('wisata_booking_draft', $draft);
        $request->session()->forget('pending_voucher_code');

        return back()->with('status', 'wisata-voucher-applied');
    }

    public function removeVoucher(Request $request): RedirectResponse
    {
        $draft = $request->session()->get('wisata_booking_draft');
        if (! $draft) {
            return redirect()->route('wisata.search');
        }

        unset($draft['voucher_code']);
        $request->session()->put('wisata_booking_draft', $draft);
        $request->session()->forget('pending_voucher_code');

        return back()->with('status', 'wisata-voucher-removed');
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
                ], $request);
            }
        }

        $booking = DB::transaction(function () use ($draft, $data, $request) {
            $destination = MitraWisataOnboarding::query()
                ->publiclyVisible()
                ->lockForUpdate()
                ->findOrFail($draft['destination_id']);
            $summary = $this->buildDraftSummary($draft, $destination, true);
            $primaryItem = $summary['items'][0];
            $voucher = null;
            $discountAmount = 0;
            $subtotal = (int) $summary['total'];

            if (! empty($draft['voucher_code'])) {
                $voucher = $this->resolveVoucher($draft['voucher_code'], true, (int) $destination->id);
                if (! $voucher) {
                    throw ValidationException::withMessages([
                        'booking' => 'Voucher tidak valid untuk destinasi ini atau sudah habis.',
                    ]);
                }

                if ($voucher->min_transaction > 0 && $subtotal < $voucher->min_transaction) {
                    throw ValidationException::withMessages([
                        'booking' => 'Minimum transaksi belum memenuhi syarat voucher.',
                    ]);
                }

                if (! $this->canUseVoucherForUser($voucher, (int) $request->user()->id)) {
                    throw ValidationException::withMessages([
                        'booking' => 'Voucher sudah mencapai limit penggunaan untuk akun ini.',
                    ]);
                }

                $discountAmount = $this->calculateDiscountAmount($subtotal, $voucher);
                $voucher->quota_used = (int) $voucher->quota_used + 1;
                $voucher->save();
            }
            $total = max(0, $subtotal - $discountAmount);

            $order = WisataBooking::create([
                'user_id' => $request->user()->id,
                'mitra_wisata_onboarding_id' => $draft['destination_id'],
                'wisata_ticket_id' => $primaryItem['ticket_id'],
                'booking_code' => strtoupper('WISATA-'.$request->user()->id.'-'.now()->format('ymdHis')),
                'visit_date' => $draft['visit_date'],
                'quantity' => $summary['quantity'],
                'unit_price' => $primaryItem['unit_price'],
                'subtotal_price' => $subtotal,
                'voucher_id' => $voucher?->id,
                'voucher_code' => $voucher?->code,
                'discount_type' => $voucher?->discount_type,
                'discount_value' => $voucher?->discount_value,
                'discount_amount' => $discountAmount > 0 ? $discountAmount : null,
                'total_price' => $total,
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

        if ((int) $booking->total_price <= 0) {
            $this->completeFreeBooking($booking);
            $request->session()->forget('wisata_booking_draft');
            $request->session()->forget('pending_voucher_code');
            $request->session()->forget('wisata_booking_pending');

            if ($request->expectsJson()) {
                return response()->json([
                    'booking_id' => $this->encryptId($booking->id),
                    'snap_token' => null,
                    'redirect_url' => route('wisata.booking.show', [
                        'booking' => $this->encryptId($booking->id),
                    ], false),
                    'payment_status' => 'paid',
                ]);
            }

            return redirect()
                ->route('wisata.booking.show', ['booking' => $this->encryptId($booking->id)])
                ->with('status', 'wisata-booking-paid');
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

        $request->session()->forget('wisata_booking_draft');
        $request->session()->forget('pending_voucher_code');
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
        ], $request);
    }

    public function payment(Request $request, string $booking): Response|RedirectResponse
    {
        $booking = $this->resolveBooking($booking);

        if ((int) $booking->user_id !== (int) $request->user()->id) {
            return redirect()->route('home');
        }

        if ((int) $booking->total_price <= 0) {
            $this->completeFreeBooking($booking);

            return redirect()->route('wisata.booking.show', ['booking' => $this->encryptId($booking->id)]);
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

        if ((int) $booking->total_price <= 0) {
            $this->completeFreeBooking($booking);

            return redirect()->route('wisata.booking.show', ['booking' => $this->encryptId($booking->id)])
                ->with('status', 'wisata-booking-paid');
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

        return Pdf::view('wisata-ticket', [
            'booking' => $booking,
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
            $quantity = (int) $selection['quantity'];
            $minOrder = max(1, (int) ($ticket->min_order_quantity ?? 1));
            $maxOrder = min(
                self::MAX_TICKETS_PER_BOOKING,
                (int) ($ticket->max_order_quantity ?: self::MAX_TICKETS_PER_BOOKING),
            );

            if ($quantity < $minOrder) {
                throw ValidationException::withMessages([
                    'items' => "Minimal pembelian {$ticket->name} {$minOrder} tiket.",
                ]);
            }

            if ($quantity > $maxOrder) {
                throw ValidationException::withMessages([
                    'items' => "Maksimal pembelian {$ticket->name} {$maxOrder} tiket.",
                ]);
            }

            if ($available < $quantity) {
                throw ValidationException::withMessages([
                    'items' => "Kuota {$ticket->name} tersisa {$available}.",
                ]);
            }

            $unitPrice = (int) $ticket->price;

            $items[] = [
                'ticket_id' => (int) $ticket->id,
                'name' => $ticket->name,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'subtotal' => $unitPrice * $quantity,
                'available' => $available,
                'ticket_kind' => $ticket->ticket_kind ?? 'single',
                'is_entry_ticket' => (bool) ($ticket->is_entry_ticket ?? true),
                'package_items' => $ticket->package_items ?? [],
            ];
        }

        $hasContinuationTicket = collect($items)->contains(
            fn (array $item) => ! (bool) ($item['is_entry_ticket'] ?? true),
        );
        $hasEntryTicket = collect($items)->contains(
            fn (array $item) => (bool) ($item['is_entry_ticket'] ?? true),
        );

        if ($hasContinuationTicket && ! $hasEntryTicket) {
            throw ValidationException::withMessages([
                'items' => 'Tiket terusan hanya dapat dipesan bersama tiket masuk.',
            ]);
        }

        return [
            'destination' => $destination,
            'items' => $items,
            'quantity' => array_sum(array_column($items, 'quantity')),
            'total' => array_sum(array_column($items, 'subtotal')),
        ];
    }

    private function reviewResponse(array $draft, array $extra = [], ?Request $request = null): Response
    {
        $summary = $this->buildDraftSummary($draft);
        $destination = $summary['destination'];
        $primaryItem = $summary['items'][0];
        $subtotal = (int) $summary['total'];
        $discountAmount = 0;
        $voucherPayload = null;
        $userId = (int) ($request?->user()?->id ?? request()->user()?->id ?? 0);

        if (! empty($draft['voucher_code'])) {
            $voucher = $this->resolveVoucher($draft['voucher_code'], false, (int) $destination->id);

            if (
                $voucher
                && ($voucher->min_transaction <= 0 || $subtotal >= $voucher->min_transaction)
                && ($userId === 0 || $this->canUseVoucherForUser($voucher, $userId))
            ) {
                $discountAmount = $this->calculateDiscountAmount($subtotal, $voucher);
                $voucherPayload = [
                    'code' => $voucher->code,
                    'discount_type' => $voucher->discount_type,
                    'discount_value' => (int) $voucher->discount_value,
                    'discount_amount' => $discountAmount,
                ];
            } else {
                unset($draft['voucher_code']);
                ($request ?? request())->session()->put('wisata_booking_draft', $draft);
            }
        }

        $pendingVoucherCode = null;
        if (empty($draft['voucher_code'])) {
            $sessionVoucherCode = ($request ?? request())->session()->get('pending_voucher_code');
            $sessionVoucher = $this->resolveVoucher($sessionVoucherCode, false, (int) $destination->id);

            if (
                $sessionVoucher
                && ($sessionVoucher->min_transaction <= 0 || $subtotal >= $sessionVoucher->min_transaction)
                && ($userId === 0 || $this->canUseVoucherForUser($sessionVoucher, $userId))
            ) {
                $pendingVoucherCode = $sessionVoucher->code;
            }
        }

        return Inertia::render('public/wisata/booking/review', array_merge([
            'draft' => [
                'destination_id' => (int) $destination->id,
                'ticket_id' => (int) $primaryItem['ticket_id'],
                'visit_date' => $draft['visit_date'],
                'quantity' => (int) $summary['quantity'],
                'items' => array_map(fn (array $item) => [
                    'ticket_id' => (int) $item['ticket_id'],
                    'quantity' => (int) $item['quantity'],
                    'ticket_kind' => $item['ticket_kind'] ?? 'single',
                    'package_items' => $item['package_items'] ?? [],
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
                'subtotal' => $subtotal,
                'discount_amount' => $discountAmount,
                'total' => max(0, $subtotal - $discountAmount),
                'quantity' => $summary['quantity'],
            ],
            'voucher' => $voucherPayload,
            'pendingVoucherCode' => $pendingVoucherCode,
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
                    'used_quantity' => (int) $item->used_quantity,
                    'remaining_quantity' => $item->remainingQuantity(),
                    'unit_price' => (int) $item->unit_price,
                    'subtotal' => (int) $item->subtotal,
                    'ticket_kind' => $item->ticket?->ticket_kind ?? 'single',
                    'package_items' => $item->ticket?->package_items ?? [],
                ])
                ->values()
                ->all();
        }

        return [[
            'ticket_id' => (int) $booking->wisata_ticket_id,
            'name' => $booking->ticket?->name ?? 'Tiket Wisata',
            'quantity' => (int) $booking->quantity,
            'used_quantity' => 0,
            'remaining_quantity' => (int) $booking->quantity,
            'unit_price' => (int) $booking->unit_price,
            'subtotal' => (int) $booking->total_price,
            'ticket_kind' => $booking->ticket?->ticket_kind ?? 'single',
            'package_items' => $booking->ticket?->package_items ?? [],
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
            'subtotal' => $booking->subtotal_price ?: $booking->total_price,
            'discount_amount' => (int) ($booking->discount_amount ?? 0),
            'voucher_code' => $booking->voucher_code,
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
        ];
    }

    private function buildSnapPayload(WisataBooking $booking, string $orderId): array
    {
        $items = $this->bookingLineItems($booking);
        $itemDetails = array_map(fn (array $item) => [
            'id' => (string) $item['ticket_id'],
            'price' => (int) $item['unit_price'],
            'quantity' => (int) $item['quantity'],
            'name' => $item['name'] ?: 'Tiket Wisata',
        ], $items);

        if ((int) ($booking->discount_amount ?? 0) > 0) {
            $itemDetails[] = [
                'id' => 'VOUCHER-'.$booking->id,
                'price' => -1 * (int) $booking->discount_amount,
                'quantity' => 1,
                'name' => 'Diskon voucher '.$booking->voucher_code,
            ];
        }

        return [
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => (int) $booking->total_price,
            ],
            'item_details' => $itemDetails,
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

    private function completeFreeBooking(WisataBooking $booking): void
    {
        if ($booking->status === 'paid' && $booking->payment_status === 'paid') {
            return;
        }

        $orderId = $booking->midtrans_order_id ?: sprintf('WISATA-FREE-%s', $booking->id);
        $payment = $booking->payments()
            ->where('payment_type', 'free_voucher')
            ->latest()
            ->first();

        if (! $payment) {
            $payment = WisataPayment::create([
                'wisata_booking_id' => $booking->id,
                'provider' => 'internal',
                'status' => 'paid',
                'gross_amount' => 0,
                'payment_type' => 'free_voucher',
                'transaction_id' => null,
                'order_id' => $orderId,
                'payload' => [
                    'reason' => 'voucher_discount_covers_total',
                    'voucher_code' => $booking->voucher_code,
                ],
            ]);
        }

        $booking->update([
            'status' => 'paid',
            'payment_status' => 'paid',
            'payment_deadline' => null,
            'midtrans_order_id' => $payment->order_id,
        ]);

        UserNotification::create([
            'user_id' => $booking->user_id,
            'title' => 'Tiket wisata aktif',
            'message' => 'Voucher menutup seluruh pembayaran. Tiket wisata kamu sudah aktif.',
            'type' => 'wisata_payment_paid',
            'data' => [
                'booking_id' => $this->encryptId($booking->id),
                'type' => 'wisata',
                'category' => 'wisata',
            ],
        ]);

        if ($booking->guest_email) {
            try {
                Mail::to($booking->guest_email)->send(new WisataTicketMail($booking));
            } catch (\Throwable $exception) {
                Log::warning('Failed to send free wisata ticket email', [
                    'booking_id' => $booking->id,
                    'message' => $exception->getMessage(),
                ]);
            }
        }
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

    private function resolveVoucher(?string $code, bool $lock = false, ?int $destinationId = null): ?Voucher
    {
        $normalizedCode = strtoupper(trim((string) $code));
        if ($normalizedCode === '') {
            return null;
        }

        $query = Voucher::query()
            ->where('code', $normalizedCode)
            ->where(function ($query) {
                $query->whereNull('hotel_id')->orWhere('hotel_id', 0);
            });

        if ($lock) {
            $query->lockForUpdate();
        }

        $voucher = $query
            ->with('wisataDestinations:id')
            ->first();

        return $voucher
            && $this->isVoucherValid($voucher)
            && $this->voucherAppliesToDestination($voucher, $destinationId)
                ? $voucher
                : null;
    }

    private function isVoucherValid(Voucher $voucher): bool
    {
        $today = now()->toDateString();

        if (! $voucher->is_active) {
            return false;
        }

        if ($voucher->starts_at && $voucher->starts_at->toDateString() > $today) {
            return false;
        }

        if ($voucher->ends_at && $voucher->ends_at->toDateString() < $today) {
            return false;
        }

        if ($voucher->quota_total > 0 && $voucher->quota_used >= $voucher->quota_total) {
            return false;
        }

        return true;
    }

    private function voucherAppliesToDestination(Voucher $voucher, ?int $destinationId): bool
    {
        $voucher->loadMissing('wisataDestinations:id');

        if ($voucher->wisataDestinations->isEmpty()) {
            return true;
        }

        if (! $destinationId) {
            return false;
        }

        return $voucher->wisataDestinations
            ->contains(fn (MitraWisataOnboarding $destination) => (int) $destination->id === (int) $destinationId);
    }

    private function calculateDiscountAmount(int $subtotal, Voucher $voucher): int
    {
        if ($subtotal <= 0) {
            return 0;
        }

        if ($voucher->discount_type === 'percentage') {
            return min($subtotal, (int) floor($subtotal * ((float) $voucher->discount_value / 100)));
        }

        return min($subtotal, (int) $voucher->discount_value);
    }

    private function canUseVoucherForUser(Voucher $voucher, int $userId): bool
    {
        $limit = (int) ($voucher->max_per_user_per_day ?? 0);
        if ($limit <= 0) {
            return true;
        }

        $usedToday = WisataBooking::query()
            ->where('user_id', $userId)
            ->where('voucher_id', $voucher->id)
            ->whereDate('created_at', now()->toDateString())
            ->count();

        return $usedToday < $limit;
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

}
