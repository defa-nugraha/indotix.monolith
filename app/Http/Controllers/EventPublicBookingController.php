<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventBooking;
use App\Models\EventPayment;
use App\Models\EventTicket;
use App\Models\UserNotification;
use App\Services\MidtransService;
use App\Services\ProductReviewService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Spatie\LaravelPdf\Facades\Pdf;

class EventPublicBookingController extends Controller
{
    private const PAYMENT_TTL_MINUTES = 15;

    public function prepare(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'event_id' => ['required', 'integer', 'exists:events,id'],
            'ticket_id' => ['required', 'integer', 'exists:event_tickets,id'],
            'quantity' => ['required', 'integer', 'min:1', 'max:20'],
        ]);

        $event = Event::query()
            ->where('id', $data['event_id'])
            ->where('status', 'published')
            ->firstOrFail();

        $ticket = EventTicket::query()->where('id', $data['ticket_id'])->firstOrFail();
        if ((int) $ticket->event_id !== (int) $event->id) {
            return back()->withErrors(['ticket_id' => 'Tiket tidak sesuai event.']);
        }

        if (! $ticket->is_active) {
            return back()->withErrors(['ticket_id' => 'Tiket belum tersedia.']);
        }

        if ($this->availableTickets($ticket) < (int) $data['quantity']) {
            return back()->withErrors(['quantity' => 'Kuota tiket tidak mencukupi.']);
        }

        $draft = [
            'event_id' => (int) $event->id,
            'ticket_id' => (int) $ticket->id,
            'quantity' => (int) $data['quantity'],
        ];

        $request->session()->put('event_booking_draft', $draft);

        if (! $request->user()) {
            return redirect()->route('login');
        }

        if ($request->user()->role !== 'user') {
            return redirect()->route('home');
        }

        return redirect()->route('events.booking.review');
    }

    public function review(Request $request): Response|RedirectResponse
    {
        $draft = $request->session()->get('event_booking_draft');
        if (! $draft) {
            return redirect()->route('events.search')->withErrors(['booking' => 'Data pemesanan tidak ditemukan.']);
        }

        $event = Event::query()->findOrFail($draft['event_id']);
        $ticket = EventTicket::query()->findOrFail($draft['ticket_id']);

        $total = (int) $ticket->price * (int) $draft['quantity'];

        return Inertia::render('public/events/booking/review', [
            'draft' => $draft,
            'event' => [
                'id' => $event->id,
                'title' => $event->title,
                'city_name' => $this->resolveCityName($event->city_code),
                'location' => $event->location,
                'start_at' => $event->start_at?->toDateTimeString(),
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

    public function confirm(Request $request, MidtransService $midtransService)
    {
        $draft = $request->session()->get('event_booking_draft');
        if (! $draft) {
            return redirect()->route('events.search')->withErrors(['booking' => 'Data pemesanan tidak ditemukan.']);
        }

        $data = $request->validate([
            'guest_name' => ['required', 'string', 'max:255'],
            'guest_email' => ['required', 'email', 'max:255'],
            'guest_phone' => ['required', 'string', 'max:30'],
            'special_request' => ['nullable', 'string', 'max:1000'],
        ]);

        $existingBookingId = $request->session()->get('event_booking_pending');
        if ($existingBookingId) {
            $existingBooking = EventBooking::query()->find($existingBookingId);
            if ($existingBooking) {
                if ($request->expectsJson()) {
                    $snap = $this->createSnapPayment($existingBooking, $midtransService);

                    return response()->json([
                        'booking_id' => $this->encryptId($existingBooking->id),
                        'snap_token' => $snap['token'] ?? null,
                        'redirect_url' => $snap['redirect_url'] ?? null,
                    ]);
                }

                $event = Event::query()->findOrFail($draft['event_id']);
                $ticket = EventTicket::query()->findOrFail($draft['ticket_id']);
                $total = (int) $ticket->price * (int) $draft['quantity'];
                $snap = $this->createSnapPayment($existingBooking, $midtransService);

                return Inertia::render('public/events/booking/review', [
                    'draft' => $draft,
                    'event' => [
                        'id' => $event->id,
                        'title' => $event->title,
                        'city_name' => $this->resolveCityName($event->city_code),
                        'location' => $event->location,
                        'start_at' => $event->start_at?->toDateTimeString(),
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
            $ticket = EventTicket::query()->lockForUpdate()->findOrFail($draft['ticket_id']);
            $available = $this->availableTickets($ticket, true);
            if ($available < (int) $draft['quantity']) {
                throw new RuntimeException('Kuota tiket sudah habis.');
            }

            $order = EventBooking::create([
                'user_id' => $request->user()->id,
                'event_id' => $draft['event_id'],
                'event_ticket_id' => $ticket->id,
                'booking_code' => strtoupper('EVENT-'.$request->user()->id.'-'.now()->format('ymdHis')),
                'quantity' => $draft['quantity'],
                'total_price' => $ticket->price * $draft['quantity'],
                'status' => 'pending_payment',
                'payment_status' => 'pending',
                'payment_deadline' => now()->addMinutes(self::PAYMENT_TTL_MINUTES),
                'guest_name' => $data['guest_name'],
                'guest_email' => $data['guest_email'],
                'guest_phone' => $data['guest_phone'],
            ]);

            return $order;
        });

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

        $request->session()->forget('event_booking_draft');
        $request->session()->put('event_booking_pending', $booking->id);

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

        return redirect()->route('events.booking.payment', [
            'booking' => $this->encryptId($booking->id),
        ]);
    }

    public function payment(Request $request, string $booking): Response
    {
        $booking = $this->resolveBooking($booking);
        $booking->load(['event', 'ticket', 'payments']);

        return Inertia::render('public/events/booking/payment', [
            'booking' => $this->buildPaymentPayload($booking),
            'snapClientKey' => (string) config('services.midtrans.client_key', ''),
            'snapScriptUrl' => config('services.midtrans.is_production')
                ? 'https://app.midtrans.com/snap/snap.js'
                : 'https://app.sandbox.midtrans.com/snap/snap.js',
        ]);
    }

    public function show(Request $request, string $booking): Response
    {
        $booking = $this->resolveBooking($booking);
        $booking->load(['event', 'ticket', 'payments']);

        $reviewUrl = $booking->event_id
            ? '/events/'.Crypt::encryptString((string) $booking->event_id)
            : null;

        return Inertia::render('public/events/booking/show', [
            'booking' => array_merge($this->buildPaymentPayload($booking), [
                'review' => [
                    'can_review' => ProductReviewService::hasUsedBooking($request->user()->id, 'event', (int) $booking->event_id),
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

        $booking->load('ticket', 'event');

        $filename = sprintf('tiket-event-%s.pdf', $booking->id);
        $cacheAllowed = in_array($booking->status, ['paid', 'completed'], true);

        $qrImage = null;
        if ($cacheAllowed) {
            $qrUrl = $this->buildQrUrl('EVENT', $booking->booking_code);
            $context = stream_context_create(['http' => ['timeout' => 4]]);
            $contents = @file_get_contents($qrUrl, false, $context);
            if ($contents !== false) {
                $qrImage = 'data:image/png;base64,'.base64_encode($contents);
            }
        }

        return Pdf::view('event-ticket', [
            'booking' => $booking,
            'qrImage' => $qrImage,
        ])->download($filename);
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
                    'price' => (int) $booking->ticket?->price,
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

    private function createSnapPayment(EventBooking $booking, MidtransService $midtransService): array
    {
        if ($booking->payments()->where('status', 'pending')->exists()) {
            return (array) ($booking->payments()->latest()->value('payload') ?? []);
        }

        $orderId = sprintf('EVENT-%s-%s', $booking->id, now()->format('YmdHis'));
        $payload = $this->buildSnapPayload($booking, $orderId);

        $snap = $midtransService->snap($payload);

        $payment = EventPayment::create([
            'event_booking_id' => $booking->id,
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

    private function resolveBooking(string $booking): EventBooking
    {
        try {
            $id = Crypt::decryptString($booking);
        } catch (\Throwable $exception) {
            abort(404);
        }

        return EventBooking::query()->findOrFail($id);
    }

    private function encryptId(int $id): string
    {
        return Crypt::encryptString((string) $id);
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

    private function buildPaymentPayload(EventBooking $booking): array
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
            'qr_data' => $this->buildQrData('EVENT', $booking->booking_code),
            'qr_url' => $this->buildQrUrl('EVENT', $booking->booking_code),
            'payment' => $payment ? [
                'status' => $payment->status,
                'payment_type' => $payment->payment_type,
                'payload' => $payment->payload,
            ] : null,
        ];
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

    private function resolveCityName(?string $cityCode): ?string
    {
        if (! $cityCode) {
            return null;
        }

        return DB::table('regencies')->where('code', $cityCode)->value('name');
    }
}
