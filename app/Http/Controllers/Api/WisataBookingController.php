<?php

namespace App\Http\Controllers\Api;

use App\Mail\WisataTicketMail;
use App\Http\Controllers\Controller;
use App\Models\MitraWisataOnboarding;
use App\Models\SystemSetting;
use App\Models\UserNotification;
use App\Models\Voucher;
use App\Models\WisataAffiliate;
use App\Models\WisataAffiliateCommission;
use App\Models\WisataAffiliateCommissionItem;
use App\Models\WisataAffiliateLink;
use App\Models\WisataBooking;
use App\Models\WisataBookingItem;
use App\Models\WisataPayment;
use App\Models\WisataTicket;
use App\Services\MidtransService;
use App\Services\WisataPaymentLifecycleService;
use App\Services\WisataTicketPdfService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use RuntimeException;

class WisataBookingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $bookings = WisataBooking::query()
            ->where('user_id', $request->user()->id)
            ->with(['ticket', 'destination', 'items.ticket', 'payments'])
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
            'destination_id' => ['required', 'string'],
            'ticket_id' => ['nullable', 'required_without:items', 'string'],
            'visit_date' => ['required', 'date', 'after_or_equal:today'],
            'quantity' => ['nullable', 'integer', 'min:1', 'max:20'],
            'items' => ['nullable', 'array', 'min:1', 'max:20'],
            'items.*.ticket_id' => ['required_with:items', 'string'],
            'items.*.quantity' => ['required_with:items', 'integer', 'min:1', 'max:20'],
            'voucher_code' => ['nullable', 'string', 'max:50'],
        ]);

        $destinationId = $this->resolveEntityId($data['destination_id']);
        if (! $destinationId) {
            return $this->invalidIdResponse('destination_id');
        }
        $data['destination_id'] = $destinationId;

        $destination = MitraWisataOnboarding::query()
            ->publiclyVisible()
            ->where('id', $data['destination_id'])
            ->first();

        if (! $destination) {
            return response()->json(['message' => 'Destinasi tidak tersedia.'], 422);
        }

        try {
            $summary = $this->buildTicketSummary($data, $destination);
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }
        $primaryItem = $summary['items'][0];

        return response()->json([
            'pricing' => [
                'unit_price' => (int) $primaryItem['unit_price'],
                'quantity' => (int) $summary['quantity'],
                'total' => (int) $summary['total'],
                'subtotal' => (int) $summary['subtotal'],
                'discount_amount' => (int) $summary['discount_amount'],
                'voucher' => $summary['voucher'] ? [
                    'code' => $summary['voucher']->code,
                    'discount_type' => $summary['voucher']->discount_type,
                    'discount_value' => (int) $summary['voucher']->discount_value,
                ] : null,
                'items' => $summary['items'],
                'ticket_kind' => $primaryItem['ticket_kind'] ?? 'single',
                'package_items' => $primaryItem['package_items'] ?? [],
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'destination_id' => ['required', 'string'],
            'ticket_id' => ['nullable', 'required_without:items', 'string'],
            'visit_date' => ['required', 'date', 'after_or_equal:today'],
            'quantity' => ['nullable', 'integer', 'min:1', 'max:20'],
            'items' => ['nullable', 'array', 'min:1', 'max:20'],
            'items.*.ticket_id' => ['required_with:items', 'string'],
            'items.*.quantity' => ['required_with:items', 'integer', 'min:1', 'max:20'],
            'guest_name' => ['required', 'string', 'max:255'],
            'guest_email' => ['required', 'email', 'max:255'],
            'special_request' => ['nullable', 'string', 'max:1000'],
            'voucher_code' => ['nullable', 'string', 'max:50'],
            'referral_code' => ['nullable', 'string', 'max:50'],
        ]);

        $destinationId = $this->resolveEntityId($data['destination_id']);
        if (! $destinationId) {
            return $this->invalidIdResponse('destination_id');
        }
        $data['destination_id'] = $destinationId;

        $profilePhone = $request->user()?->phone;
        if (! $profilePhone) {
            return response()->json(['message' => 'Nomor HP belum diisi di profil.'], 422);
        }
        $data['guest_phone'] = $profilePhone;

        $destination = MitraWisataOnboarding::query()
            ->publiclyVisible()
            ->where('id', $data['destination_id'])
            ->first();

        if (! $destination) {
            return response()->json(['message' => 'Destinasi tidak tersedia.'], 422);
        }

        $link = $this->resolveAffiliateLinkFromCode($data['referral_code'] ?? null);

        try {
            $booking = DB::transaction(function () use ($request, $data, $destination, $link) {
                $summary = $this->buildTicketSummary($data, $destination, true, (int) $request->user()->id);
                $primaryItem = $summary['items'][0];
                $voucher = $summary['voucher'];

                if ($voucher) {
                    $voucher->quota_used = (int) $voucher->quota_used + 1;
                    $voucher->save();
                }

                $order = WisataBooking::create([
                    'user_id' => $request->user()->id,
                    'mitra_wisata_onboarding_id' => $destination->id,
                    'wisata_ticket_id' => $primaryItem['ticket_id'],
                    'booking_code' => strtoupper('WISATA-'.$request->user()->id.'-'.now()->format('ymdHis')),
                    'visit_date' => $data['visit_date'],
                    'quantity' => $summary['quantity'],
                    'unit_price' => $primaryItem['unit_price'],
                    'subtotal_price' => $summary['subtotal'],
                    'voucher_id' => $voucher?->id,
                    'voucher_code' => $voucher?->code,
                    'discount_type' => $voucher?->discount_type,
                    'discount_value' => $voucher?->discount_value,
                    'discount_amount' => $summary['discount_amount'],
                    'total_price' => $summary['total'],
                    'status' => 'pending_payment',
                    'payment_status' => 'pending',
                'payment_deadline' => now()->addMinutes(SystemSetting::wisataBookingTimeoutMinutes()),
                    'guest_name' => $data['guest_name'],
                    'guest_email' => $data['guest_email'],
                    'guest_phone' => $data['guest_phone'],
                    'special_request' => $data['special_request'] ?? null,
                ]);

                foreach ($summary['items'] as $item) {
                    $order->items()->create([
                        'wisata_ticket_id' => $item['ticket_id'],
                        'ticket_name' => $item['name'],
                        'quantity' => (int) $item['quantity'],
                        'unit_price' => (int) $item['unit_price'],
                        'subtotal' => (int) $item['subtotal'],
                    ]);
                }

                $this->attachAffiliateCommission($order, $link);

                return $order;
            });
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        if ((int) $booking->total_price <= 0) {
            $this->completeFreeBooking($booking);
            $booking->load(['ticket', 'destination', 'items.ticket', 'payments']);

            return response()->json([
                'booking' => $this->bookingPayload($booking),
            ], 201);
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

        $booking->load(['ticket', 'destination', 'items.ticket', 'payments']);

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

        $booking->load(['ticket', 'destination', 'items.ticket', 'payments']);

        return response()->json([
            'booking' => $this->bookingPayload($booking),
        ]);
    }

    public function pay(Request $request, string $booking, WisataPaymentLifecycleService $payments): JsonResponse
    {
        $booking = $this->resolveBooking($booking);

        if ((int) $booking->user_id !== (int) $request->user()->id) {
            return response()->json(['message' => 'Data tidak ditemukan.'], 404);
        }

        if ((int) $booking->total_price <= 0) {
            $this->completeFreeBooking($booking);
            $booking->load(['ticket', 'destination', 'items.ticket', 'payments']);

            return response()->json(['booking' => $this->bookingPayload($booking)]);
        }

        if ($booking->isExpired()) {
            try {
                $payments->expireBooking($booking);
            } catch (\Throwable $exception) {
                Log::warning('Unable to synchronize expired wisata booking with Midtrans.', [
                    'booking_id' => $booking->id,
                    'message' => $exception->getMessage(),
                ]);
            }

            return response()->json(['message' => 'Booking sudah kedaluwarsa.'], 422);
        }

        try {
            $payment = $payments->createOrGetSnapPayment($booking);
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        } catch (\Throwable $exception) {
            Log::warning('Midtrans wisata payment creation failed', [
                'booking_id' => $booking->id,
                'message' => $exception->getMessage(),
            ]);

            return response()->json([
                'message' => 'Status pembuatan pembayaran belum dapat dipastikan. Silakan coba beberapa saat lagi.',
            ], 503);
        }

        return response()->json([
            'payment' => [
                'order_id' => $payment->order_id,
                'status' => $payment->status,
                'snap_token' => $payment->payload['token'] ?? null,
                'redirect_url' => $payment->payload['redirect_url'] ?? null,
            ],
        ]);
    }

    public function cancel(Request $request, string $booking, WisataPaymentLifecycleService $payments): JsonResponse
    {
        $booking = $this->resolveBooking($booking);

        if ((int) $booking->user_id !== (int) $request->user()->id) {
            return response()->json(['message' => 'Data tidak ditemukan.'], 404);
        }

        try {
            $booking = $payments->cancelBooking(
                $booking,
                $request->string('reason')->toString() ?: null,
            );
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        } catch (\Throwable $exception) {
            Log::warning('Wisata cancellation synchronization failed.', [
                'booking_id' => $booking->id,
                'message' => $exception->getMessage(),
            ]);

            return response()->json([
                'message' => 'Pembatalan belum dapat dipastikan. Pesanan belum ditandai batal dan akan direkonsiliasi.',
            ], 503);
        }

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

        $booking->load(['ticket', 'destination', 'items.ticket', 'payments']);

        return response()->json(['booking' => $this->bookingPayload($booking)]);
    }

    public function ticket(Request $request, string $booking, WisataTicketPdfService $ticketPdf)
    {
        $booking = $this->resolveBooking($booking);

        if ((int) $booking->user_id !== (int) $request->user()->id) {
            return response()->json(['message' => 'Data tidak ditemukan.'], 404);
        }

        if (! in_array($booking->status, ['paid', 'completed'], true)) {
            return response()->json(['message' => 'Tiket hanya tersedia setelah pembayaran berhasil.'], 403);
        }

        $booking->load('ticket', 'destination', 'items.ticket');

        $filename = sprintf('tiket-wisata-%s.pdf', $booking->id);

        return response($ticketPdf->render($booking), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            'Cache-Control' => 'private, no-store, max-age=0',
        ]);
    }

    private function buildTicketSummary(array $data, MitraWisataOnboarding $destination, bool $lock = false, ?int $userId = null): array
    {
        $selections = $this->normalizeTicketSelections($data);
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

            if (! $ticket) {
                throw new RuntimeException('Tiket tidak tersedia.');
            }

            if ((int) $ticket->mitra_wisata_onboarding_id !== (int) $destination->id) {
                throw new RuntimeException('Tiket tidak sesuai destinasi.');
            }

            if (! $ticket->is_active || $ticket->is_closed) {
                throw new RuntimeException('Tiket belum tersedia.');
            }

            $visitDate = \Carbon\Carbon::parse($data['visit_date'])->startOfDay();
            if ($ticket->valid_from && $visitDate->lt($ticket->valid_from->startOfDay())) {
                throw new RuntimeException('Tiket belum berlaku pada tanggal kunjungan.');
            }
            if ($ticket->valid_until && $visitDate->gt($ticket->valid_until->startOfDay())) {
                throw new RuntimeException('Masa berlaku tiket sudah berakhir untuk tanggal kunjungan.');
            }

            $quantity = (int) $selection['quantity'];

            if ($message = $this->ticketOrderLimitMessage($ticket, $quantity)) {
                throw new RuntimeException($message);
            }

            $available = $this->availableTickets($ticket, $data['visit_date'], $lock);
            if ($available < $quantity) {
                throw new RuntimeException('Kuota tiket tidak mencukupi.');
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
            throw new RuntimeException('Tiket terusan hanya dapat dipesan bersama tiket masuk.');
        }

        $subtotal = array_sum(array_column($items, 'subtotal'));
        $voucher = $this->resolveWisataVoucher($data['voucher_code'] ?? null, $destination, $subtotal, $userId, $lock);
        $discountAmount = $voucher
            ? $this->calculateDiscountAmount($subtotal, $voucher)
            : 0;

        return [
            'items' => $items,
            'quantity' => array_sum(array_column($items, 'quantity')),
            'subtotal' => $subtotal,
            'discount_amount' => $discountAmount,
            'voucher' => $voucher,
            'total' => max(0, $subtotal - $discountAmount),
        ];
    }

    private function resolveWisataVoucher(?string $code, MitraWisataOnboarding $destination, int $subtotal, ?int $userId, bool $lock): ?Voucher
    {
        $normalized = strtoupper(trim((string) $code));
        if ($normalized === '') {
            return null;
        }

        $query = Voucher::query()
            ->where('code', $normalized)
            ->where('is_active', true)
            ->where(function ($query) {
                $query->whereNull('hotel_id')->orWhere('hotel_id', 0);
            });
        if ($lock) {
            $query->lockForUpdate();
        }
        $voucher = $query->first();

        $today = now()->toDateString();
        if (! $voucher || ($voucher->starts_at && $voucher->starts_at->toDateString() > $today) || ($voucher->ends_at && $voucher->ends_at->toDateString() < $today)) {
            throw new RuntimeException('Voucher tidak valid atau sudah tidak berlaku.');
        }
        if ($voucher->quota_total > 0 && $voucher->quota_used >= $voucher->quota_total) {
            throw new RuntimeException('Voucher sudah habis.');
        }
        if ($voucher->min_transaction > 0 && $subtotal < $voucher->min_transaction) {
            throw new RuntimeException('Minimum transaksi belum memenuhi syarat voucher.');
        }

        $hasDestinationScope = $voucher->wisataDestinations()->exists();
        if ($hasDestinationScope && ! $voucher->wisataDestinations()->whereKey($destination->id)->exists()) {
            throw new RuntimeException('Voucher tidak berlaku untuk destinasi ini.');
        }
        if ($userId && ! $this->canUseWisataVoucher($voucher, $userId)) {
            throw new RuntimeException('Voucher sudah mencapai limit penggunaan untuk akun ini.');
        }

        return $voucher;
    }

    private function calculateDiscountAmount(int $subtotal, Voucher $voucher): int
    {
        if ($voucher->discount_type === 'fixed') {
            return min($subtotal, (int) $voucher->discount_value);
        }

        return min($subtotal, (int) round($subtotal * ((int) $voucher->discount_value / 100)));
    }

    private function canUseWisataVoucher(Voucher $voucher, int $userId): bool
    {
        if ((int) $voucher->max_per_user_per_day <= 0) {
            return true;
        }

        $query = WisataBooking::query()
            ->where('voucher_id', $voucher->id)
            ->where('user_id', $userId);
        if ($voucher->starts_at) {
            $query->whereDate('created_at', '>=', $voucher->starts_at->toDateString());
        }
        if ($voucher->ends_at) {
            $query->whereDate('created_at', '<=', $voucher->ends_at->toDateString());
        }

        return $query->count() < (int) $voucher->max_per_user_per_day;
    }

    private function normalizeTicketSelections(array $data): array
    {
        if (! empty($data['items']) && is_array($data['items'])) {
            $items = collect($data['items'])
                ->map(function (array $item) {
                    $ticketId = $this->resolveEntityId((string) ($item['ticket_id'] ?? ''));

                    if (! $ticketId) {
                        throw new RuntimeException('ID tiket tidak valid.');
                    }

                    return [
                        'ticket_id' => $ticketId,
                        'quantity' => (int) ($item['quantity'] ?? 0),
                    ];
                })
                ->filter(fn (array $item) => $item['quantity'] > 0)
                ->groupBy('ticket_id')
                ->map(fn ($rows, $ticketId) => [
                    'ticket_id' => (int) $ticketId,
                    'quantity' => (int) collect($rows)->sum('quantity'),
                ])
                ->values();

            if ($items->isEmpty()) {
                throw new RuntimeException('Pilih tiket terlebih dahulu.');
            }

            return $items->all();
        }

        $ticketId = $this->resolveEntityId((string) ($data['ticket_id'] ?? ''));
        if (! $ticketId) {
            throw new RuntimeException('ID tiket tidak valid.');
        }

        return [[
            'ticket_id' => $ticketId,
            'quantity' => (int) ($data['quantity'] ?? 1),
        ]];
    }

    private function bookingPayload(WisataBooking $booking): array
    {
        $items = $this->bookingLineItems($booking);
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
            'voucher' => $booking->voucher_code ? [
                'code' => $booking->voucher_code,
                'discount_amount' => (int) ($booking->discount_amount ?? 0),
            ] : null,
            'payment_deadline' => $booking->payment_deadline?->toIso8601String(),
            'ticket' => [
                'id' => $booking->ticket?->id,
                'name' => $booking->ticket?->name,
            ],
            'items' => $items,
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
        ];
    }

    private function ticketOrderLimitMessage(WisataTicket $ticket, int $quantity): ?string
    {
        $minOrder = max(1, (int) ($ticket->min_order_quantity ?? 1));
        $maxOrder = min(20, (int) ($ticket->max_order_quantity ?: 20));

        if ($quantity < $minOrder) {
            return "Minimal pembelian {$ticket->name} {$minOrder} tiket.";
        }

        if ($quantity > $maxOrder) {
            return "Maksimal pembelian {$ticket->name} {$maxOrder} tiket.";
        }

        return null;
    }

    private function availableTickets(WisataTicket $ticket, string $date, bool $lock = false): int
    {
        $itemQuery = WisataBookingItem::query()
            ->where('wisata_ticket_id', $ticket->id)
            ->whereHas('booking', function ($query) use ($date) {
                $query
                    ->whereDate('visit_date', $date)
                    ->where(function ($statusQuery) {
                        $statusQuery->whereIn('status', ['paid', 'completed'])
                            ->orWhere(function ($pendingQuery) {
                                $pendingQuery->where('status', 'pending_payment')
                                    ->where(function ($deadlineQuery) {
                                        $deadlineQuery->whereNull('payment_deadline')
                                            ->orWhere('payment_deadline', '>', now());
                                    });
                            });
                    });
            });

        if ($lock) {
            $itemQuery->lockForUpdate();
        }

        $legacyQuery = WisataBooking::query()
            ->where('wisata_ticket_id', $ticket->id)
            ->whereDate('visit_date', $date)
            ->where(function ($statusQuery) {
                $statusQuery->whereIn('status', ['paid', 'completed'])
                    ->orWhere(function ($pendingQuery) {
                        $pendingQuery->where('status', 'pending_payment')
                            ->where(function ($deadlineQuery) {
                                $deadlineQuery->whereNull('payment_deadline')
                                    ->orWhere('payment_deadline', '>', now());
                            });
                    });
            })
            ->whereDoesntHave('items');

        if ($lock) {
            $legacyQuery->lockForUpdate();
        }

        $reserved = (int) $itemQuery->sum('quantity') + (int) $legacyQuery->sum('quantity');
        $maxQuota = $ticket->daily_quota ?? $ticket->quota;

        return max(0, (int) $maxQuota - $reserved);
    }

    private function bookingLineItems(WisataBooking $booking): array
    {
        $booking->loadMissing(['ticket', 'items.ticket']);

        if ($booking->items->isNotEmpty()) {
            return $booking->items
                ->map(fn (WisataBookingItem $item): array => [
                    'ticket_id' => $item->wisata_ticket_id,
                    'name' => $item->ticket_name ?: ($item->ticket?->name ?? 'Tiket Wisata'),
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
            'ticket_id' => $booking->wisata_ticket_id,
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

    private function buildSnapPayload(WisataBooking $booking, string $orderId): array
    {
        $items = $this->bookingLineItems($booking);

        return [
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => (int) $booking->total_price,
            ],
            'item_details' => collect($items)
                ->map(fn (array $item): array => [
                    'id' => (string) $item['ticket_id'],
                    'price' => (int) $item['unit_price'],
                    'quantity' => (int) $item['quantity'],
                    'name' => $item['name'],
                ])
                ->values()
                ->all(),
            'customer_details' => [
                'first_name' => $booking->guest_name,
                'email' => $booking->guest_email,
                'phone' => $booking->guest_phone,
            ],
            'expiry' => [
                'duration' => max(1, (int) now()->diffInMinutes($booking->payment_deadline ?? now()->addMinutes(SystemSetting::wisataBookingTimeoutMinutes()))),
                'unit' => 'minute',
            ],
        ];
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

}
