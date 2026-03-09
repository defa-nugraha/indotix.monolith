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

class SpecialProgramBookingController extends Controller
{
    private const PAYMENT_TTL_MINUTES = 1440;

    public function prepare(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'program_id' => ['required', 'integer', 'exists:events,id'],
            'ticket_id' => ['required', 'integer', 'exists:event_tickets,id'],
            'quantity' => ['required', 'integer', 'min:1', 'max:20'],
        ]);

        $program = Event::query()
            ->where('id', $data['program_id'])
            ->where('event_type', 'special_program')
            ->where('status', 'published')
            ->firstOrFail();

        $ticket = EventTicket::query()->where('id', $data['ticket_id'])->firstOrFail();
        if ((int) $ticket->event_id !== (int) $program->id) {
            return back()->withErrors(['ticket_id' => 'Tiket tidak sesuai program.']);
        }

        if (! $ticket->is_active) {
            return back()->withErrors(['ticket_id' => 'Tiket belum tersedia.']);
        }

        if ($this->availableTickets($ticket) < (int) $data['quantity']) {
            return back()->withErrors(['quantity' => 'Kuota tiket tidak mencukupi.']);
        }

        $draft = [
            'program_id' => (int) $program->id,
            'ticket_id' => (int) $ticket->id,
            'quantity' => (int) $data['quantity'],
        ];

        $request->session()->put('special_program_booking_draft', $draft);

        if (! $request->user()) {
            return redirect()->route('login');
        }

        if ($request->user()->role !== 'user') {
            return redirect()->route('home');
        }

        return redirect()->route('special-programs.booking.review');
    }

    public function review(Request $request): Response|RedirectResponse
    {
        $draft = $request->session()->get('special_program_booking_draft');
        if (! $draft) {
            return redirect()->route('special-programs.search')->withErrors(['booking' => 'Data pemesanan tidak ditemukan.']);
        }

        $program = Event::query()
            ->where('event_type', 'special_program')
            ->where('id', $draft['program_id'])
            ->firstOrFail();
        $ticket = EventTicket::query()->findOrFail($draft['ticket_id']);
        if ((int) $ticket->event_id !== (int) $program->id) {
            return redirect()->route('special-programs.search')->withErrors(['booking' => 'Tiket tidak sesuai program.']);
        }
        if (! $ticket->is_active) {
            return redirect()->route('special-programs.search')->withErrors(['booking' => 'Tiket belum tersedia.']);
        }

        $total = (int) $ticket->price * (int) $draft['quantity'];

        return Inertia::render('public/special-programs/booking/review', [
            'draft' => $draft,
            'program' => [
                'id' => $program->id,
                'title' => $program->title,
                'city_name' => $this->resolveCityName($program->city_code),
                'location' => $program->location,
                'start_at' => $program->start_at?->toDateTimeString(),
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
        $draft = $request->session()->get('special_program_booking_draft');
        if (! $draft) {
            return redirect()->route('special-programs.search')->withErrors(['booking' => 'Data pemesanan tidak ditemukan.']);
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

        $existingBookingId = $request->session()->get('special_program_booking_pending');
        if ($existingBookingId) {
            $existingBooking = EventBooking::query()->find($existingBookingId);
            if ($existingBooking) {
                $existingBooking->loadMissing('event');
                if ($existingBooking->event?->event_type !== 'special_program') {
                    $request->session()->forget('special_program_booking_pending');
                } else {
                if ($request->expectsJson()) {
                    $snap = $this->createSnapPayment($existingBooking, $midtransService);

                    return response()->json([
                        'booking_id' => $this->encryptId($existingBooking->id),
                        'snap_token' => $snap['token'] ?? null,
                        'redirect_url' => $snap['redirect_url'] ?? null,
                    ]);
                }

                $program = Event::query()
                    ->where('event_type', 'special_program')
                    ->where('id', $draft['program_id'])
                    ->firstOrFail();
                $ticket = EventTicket::query()->findOrFail($draft['ticket_id']);
                $total = (int) $ticket->price * (int) $draft['quantity'];
                $snap = $this->createSnapPayment($existingBooking, $midtransService);

                return Inertia::render('public/special-programs/booking/review', [
                    'draft' => $draft,
                    'program' => [
                        'id' => $program->id,
                        'title' => $program->title,
                        'city_name' => $this->resolveCityName($program->city_code),
                        'location' => $program->location,
                        'start_at' => $program->start_at?->toDateTimeString(),
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
        }

        $booking = DB::transaction(function () use ($draft, $data, $request) {
            $program = Event::query()
                ->where('event_type', 'special_program')
                ->where('id', $draft['program_id'])
                ->firstOrFail();
            $ticket = EventTicket::query()->lockForUpdate()->findOrFail($draft['ticket_id']);
            if ((int) $ticket->event_id !== (int) $program->id) {
                throw new RuntimeException('Tiket tidak sesuai program.');
            }
            if (! $ticket->is_active) {
                throw new RuntimeException('Tiket belum tersedia.');
            }
            $available = $this->availableTickets($ticket, true);
            if ($available < (int) $draft['quantity']) {
                throw new RuntimeException('Kuota tiket sudah habis.');
            }

            return EventBooking::create([
                'user_id' => $request->user()->id,
                'event_id' => $draft['program_id'],
                'event_ticket_id' => $ticket->id,
                'booking_code' => strtoupper('SPECIAL-'.$request->user()->id.'-'.now()->format('ymdHis')),
                'quantity' => $draft['quantity'],
                'total_price' => $ticket->price * $draft['quantity'],
                'status' => 'pending_payment',
                'payment_status' => 'pending',
                'payment_deadline' => now()->addMinutes(self::PAYMENT_TTL_MINUTES),
                'guest_name' => $data['guest_name'],
                'guest_email' => $data['guest_email'],
                'guest_phone' => $data['guest_phone'],
            ]);
        });

        UserNotification::create([
            'user_id' => $request->user()->id,
            'title' => 'Pemesanan special program berhasil',
            'message' => 'Pesanan special program sudah dibuat. Silakan lanjutkan pembayaran.',
            'type' => 'special_program_booking_created',
            'data' => [
                'booking_id' => $this->encryptId($booking->id),
                'type' => 'special_program',
                'category' => 'special_program',
            ],
        ]);

        UserNotification::create([
            'user_id' => $request->user()->id,
            'title' => 'Menunggu pembayaran special program',
            'message' => 'Ada pembayaran special program yang perlu diselesaikan.',
            'type' => 'special_program_payment_pending',
            'data' => [
                'booking_id' => $this->encryptId($booking->id),
                'type' => 'special_program',
                'category' => 'special_program',
            ],
        ]);

        $request->session()->forget('special_program_booking_draft');
        $request->session()->put('special_program_booking_pending', $booking->id);

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

        $program = Event::query()
            ->where('event_type', 'special_program')
            ->where('id', $draft['program_id'])
            ->firstOrFail();
        $ticket = EventTicket::query()->findOrFail($draft['ticket_id']);
        $total = (int) $ticket->price * (int) $draft['quantity'];
        $snap = $this->createSnapPayment($booking, $midtransService);

        return Inertia::render('public/special-programs/booking/review', [
            'draft' => $draft,
            'program' => [
                'id' => $program->id,
                'title' => $program->title,
                'city_name' => $this->resolveCityName($program->city_code),
                'location' => $program->location,
                'start_at' => $program->start_at?->toDateTimeString(),
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
        $booking->load(['event', 'ticket', 'payments']);
        abort_unless($booking->event?->event_type === 'special_program', 404);

        return Inertia::render('public/special-programs/booking/payment', [
            'booking' => $this->buildPaymentPayload($booking),
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

        $booking->loadMissing('event');
        abort_unless($booking->event?->event_type === 'special_program', 404);

        if ($booking->isExpired()) {
            $booking->update([
                'status' => 'expired',
                'payment_status' => 'expired',
            ]);

            return redirect()->route('special-programs.booking.payment', ['booking' => $this->encryptId($booking->id)])
                ->withErrors(['payment' => 'Booking sudah kedaluwarsa.']);
        }

        if ($booking->status !== 'pending_payment') {
            return redirect()->route('special-programs.booking.payment', ['booking' => $this->encryptId($booking->id)]);
        }

        if ($booking->payments()->where('status', 'pending')->exists()) {
            return redirect()->route('special-programs.booking.payment', ['booking' => $this->encryptId($booking->id)]);
        }

        $this->createSnapPayment($booking, $midtransService);

        return redirect()->route('special-programs.booking.payment', ['booking' => $this->encryptId($booking->id)]);
    }

    public function show(Request $request, string $booking): Response|RedirectResponse
    {
        $booking = $this->resolveBooking($booking);
        if ((int) $booking->user_id !== (int) $request->user()->id) {
            return redirect()->route('home');
        }
        $booking->load(['event', 'ticket', 'payments']);
        abort_unless($booking->event?->event_type === 'special_program', 404);

        $reviewUrl = $booking->event_id
            ? '/special-programs/'.$booking->event?->slug
            : null;

        return Inertia::render('public/special-programs/booking/show', [
            'booking' => array_merge($this->buildPaymentPayload($booking), [
                'review' => [
                    'can_review' => ProductReviewService::hasUsedBooking($request->user()->id, 'special_program', (int) $booking->event_id),
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
        abort_unless($booking->event?->event_type === 'special_program', 404);

        $filename = sprintf('tiket-special-program-%s.pdf', $booking->id);
        $cacheAllowed = in_array($booking->status, ['paid', 'completed'], true);

        $qrImage = null;
        if ($cacheAllowed) {
            $qrUrl = $this->buildQrUrl('SPECIAL_PROGRAM', $booking->booking_code);
            $context = stream_context_create(['http' => ['timeout' => 4]]);
            $contents = @file_get_contents($qrUrl, false, $context);
            if ($contents !== false) {
                $qrImage = 'data:image/png;base64,'.base64_encode($contents);
            }
        }

        return Pdf::view('special-program-ticket', [
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
                    'name' => $booking->ticket?->name ?? 'Tiket Special Program',
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

        $orderId = sprintf('SPECIAL-%s-%s', $booking->id, now()->format('YmdHis'));
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
            'program' => [
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
            'qr_data' => $this->buildQrData('SPECIAL_PROGRAM', $booking->booking_code),
            'qr_url' => $this->buildQrUrl('SPECIAL_PROGRAM', $booking->booking_code),
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
