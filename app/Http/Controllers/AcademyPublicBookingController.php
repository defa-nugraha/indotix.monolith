<?php

namespace App\Http\Controllers;

use App\Models\AcademyBooking;
use App\Models\AcademyClass;
use App\Models\AcademyPayment;
use App\Models\AcademyTicket;
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

class AcademyPublicBookingController extends Controller
{
    private const PAYMENT_TTL_MINUTES = 15;

    public function prepare(Request $request): RedirectResponse
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

        $ticket = AcademyTicket::query()->where('id', $data['ticket_id'])->firstOrFail();
        if ((int) $ticket->academy_class_id !== (int) $class->id) {
            return back()->withErrors(['ticket_id' => 'Tiket tidak sesuai kelas.']);
        }

        if (! $ticket->is_active) {
            return back()->withErrors(['ticket_id' => 'Tiket belum tersedia.']);
        }

        if (! $this->isTicketOnSale($ticket)) {
            return back()->withErrors(['ticket_id' => 'Penjualan tiket belum dibuka atau sudah berakhir.']);
        }

        if ($this->availableTickets($ticket) < (int) $data['quantity']) {
            return back()->withErrors(['quantity' => 'Kuota tiket tidak mencukupi.']);
        }

        $draft = [
            'class_id' => (int) $class->id,
            'ticket_id' => (int) $ticket->id,
            'quantity' => (int) $data['quantity'],
        ];

        $request->session()->put('academy_booking_draft', $draft);

        if (! $request->user()) {
            return redirect()->route('login');
        }

        if ($request->user()->role !== 'user') {
            return redirect()->route('home');
        }

        return redirect()->route('academy.booking.review');
    }

    public function review(Request $request): Response|RedirectResponse
    {
        $draft = $request->session()->get('academy_booking_draft');
        if (! $draft) {
            return redirect()->route('academy.search')->withErrors(['booking' => 'Data pemesanan tidak ditemukan.']);
        }

        $class = AcademyClass::query()->findOrFail($draft['class_id']);
        $ticket = AcademyTicket::query()->findOrFail($draft['ticket_id']);

        $total = (int) $ticket->price * (int) $draft['quantity'];

        return Inertia::render('public/academy/booking/review', [
            'draft' => $draft,
            'class' => [
                'id' => $class->id,
                'title' => $class->title,
                'category' => $class->category,
                'location_detail' => $class->location_detail,
                'start_at' => $class->start_at?->toDateTimeString(),
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
        $draft = $request->session()->get('academy_booking_draft');
        if (! $draft) {
            return redirect()->route('academy.search')->withErrors(['booking' => 'Data pemesanan tidak ditemukan.']);
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

        $existingBookingId = $request->session()->get('academy_booking_pending');
        if ($existingBookingId) {
            $existingBooking = AcademyBooking::query()->find($existingBookingId);
            if ($existingBooking) {
                if ($request->expectsJson()) {
                    $snap = $this->createSnapPayment($existingBooking, $midtransService);

                    return response()->json([
                        'booking_id' => $this->encryptId($existingBooking->id),
                        'snap_token' => $snap['token'] ?? null,
                        'redirect_url' => $snap['redirect_url'] ?? null,
                    ]);
                }

                $class = AcademyClass::query()->findOrFail($draft['class_id']);
                $ticket = AcademyTicket::query()->findOrFail($draft['ticket_id']);
                $total = (int) $ticket->price * (int) $draft['quantity'];
                $snap = $this->createSnapPayment($existingBooking, $midtransService);

                return Inertia::render('public/academy/booking/review', [
                    'draft' => $draft,
                    'class' => [
                        'id' => $class->id,
                        'title' => $class->title,
                        'category' => $class->category,
                        'location_detail' => $class->location_detail,
                        'start_at' => $class->start_at?->toDateTimeString(),
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
            $ticket = AcademyTicket::query()->lockForUpdate()->findOrFail($draft['ticket_id']);
            if (! $this->isTicketOnSale($ticket)) {
                throw new RuntimeException('Penjualan tiket belum dibuka atau sudah berakhir.');
            }
            $available = $this->availableTickets($ticket, true);
            if ($available < (int) $draft['quantity']) {
                throw new RuntimeException('Kuota tiket sudah habis.');
            }

            return AcademyBooking::create([
                'user_id' => $request->user()->id,
                'academy_class_id' => $draft['class_id'],
                'academy_ticket_id' => $ticket->id,
                'booking_code' => strtoupper('ACD-'.$request->user()->id.'-'.now()->format('ymdHis')),
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

        $request->session()->forget('academy_booking_draft');
        $request->session()->put('academy_booking_pending', $booking->id);

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

        return redirect()->route('academy.booking.payment', [
            'booking' => $this->encryptId($booking->id),
        ]);
    }

    public function payment(Request $request, string $booking): Response
    {
        $booking = $this->resolveBooking($booking);
        $booking->load(['academyClass', 'ticket', 'payments']);

        return Inertia::render('public/academy/booking/payment', [
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
        $booking->load(['academyClass', 'ticket', 'payments']);

        $reviewUrl = $booking->academy_class_id
            ? '/academy/'.$booking->academyClass?->slug
            : null;

        return Inertia::render('public/academy/booking/show', [
            'booking' => array_merge($this->buildPaymentPayload($booking), [
                'review' => [
                    'can_review' => ProductReviewService::hasUsedBooking($request->user()->id, 'academy', (int) $booking->academy_class_id),
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

        $booking->load('ticket', 'academyClass');

        $filename = sprintf('tiket-academy-%s.pdf', $booking->id);
        $cacheAllowed = in_array($booking->status, ['paid', 'completed'], true);

        $qrImage = null;
        if ($cacheAllowed) {
            $qrUrl = $this->buildQrUrl('ACADEMY', $booking->booking_code);
            $context = stream_context_create(['http' => ['timeout' => 4]]);
            $contents = @file_get_contents($qrUrl, false, $context);
            if ($contents !== false) {
                $qrImage = 'data:image/png;base64,'.base64_encode($contents);
            }
        }

        return Pdf::view('academy-ticket', [
            'booking' => $booking,
            'qrImage' => $qrImage,
        ])->download($filename);
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
                    'price' => (int) $booking->ticket?->price,
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

    private function createSnapPayment(AcademyBooking $booking, MidtransService $midtransService): array
    {
        if ($booking->payments()->where('status', 'pending')->exists()) {
            return (array) ($booking->payments()->latest()->value('payload') ?? []);
        }

        $orderId = sprintf('ACD-%s-%s', $booking->id, now()->format('YmdHis'));
        $payload = $this->buildSnapPayload($booking, $orderId);

        $snap = $midtransService->snap($payload);

        $payment = AcademyPayment::create([
            'academy_booking_id' => $booking->id,
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

    private function resolveBooking(string $booking): AcademyBooking
    {
        try {
            $id = Crypt::decryptString($booking);
        } catch (\Throwable $exception) {
            abort(404);
        }

        return AcademyBooking::query()->findOrFail($id);
    }

    private function encryptId(int $id): string
    {
        return Crypt::encryptString((string) $id);
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

    private function buildPaymentPayload(AcademyBooking $booking): array
    {
        $payment = $booking->payments()->latest()->first();
        $class = $booking->academyClass;

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
                'id' => $class?->id,
                'title' => $class?->title ?? 'Produk tidak tersedia',
                'location' => $class?->location_detail,
                'start_at' => $class?->start_at?->toDateTimeString(),
            ],
            'guest' => [
                'name' => $booking->guest_name,
                'email' => $booking->guest_email,
                'phone' => $booking->guest_phone,
            ],
            'qr_data' => $this->buildQrData('ACADEMY', $booking->booking_code),
            'qr_url' => $this->buildQrUrl('ACADEMY', $booking->booking_code),
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
}
