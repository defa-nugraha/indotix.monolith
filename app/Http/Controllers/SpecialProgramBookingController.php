<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventTicket;
use App\Models\Hotel;
use App\Models\MitraWisataOnboarding;
use App\Models\SpecialProgram;
use App\Models\SpecialProgramBooking;
use App\Models\SpecialProgramPayment;
use App\Models\WisataTicket;
use App\Models\UserNotification;
use App\Services\MidtransService;
use App\Services\ProductReviewService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SpecialProgramBookingController extends Controller
{
    private const PAYMENT_TTL_MINUTES = 1440;

    public function prepare(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'program_id' => ['required', 'integer', 'exists:special_programs,id'],
            'item_type' => ['required', 'string', 'in:wisata,event'],
            'item_id' => ['required', 'integer'],
            'ticket_id' => ['nullable', 'integer'],
            'visit_date' => ['nullable', 'date'],
            'quantity' => ['required', 'integer', 'min:1', 'max:20'],
        ]);

        if (empty($data['visit_date'])) {
            return back()->withErrors(['visit_date' => 'Tanggal kunjungan wajib diisi.']);
        }

        $program = SpecialProgram::query()->where('id', $data['program_id'])->where('is_active', true)->firstOrFail();
        $itemExists = \App\Models\SpecialProgramItem::query()
            ->where('special_program_id', $program->id)
            ->where('item_type', $data['item_type'])
            ->where('item_id', $data['item_id'])
            ->where('is_active', true)
            ->exists();
        if (! $itemExists) {
            return back()->withErrors(['booking' => 'Produk tidak tersedia dalam program ini.']);
        }

        $ticketPayload = $this->resolveTicketPayload($data['item_type'], (int) $data['item_id'], $data['ticket_id'] ?? null);

        $draft = [
            'program_id' => (int) $program->id,
            'item_type' => $data['item_type'],
            'item_id' => (int) $data['item_id'],
            'ticket_id' => $ticketPayload['ticket_id'],
            'visit_date' => $data['visit_date'],
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

        $program = SpecialProgram::query()->findOrFail($draft['program_id']);
        $payload = $this->resolveTicketPayload($draft['item_type'], (int) $draft['item_id'], $draft['ticket_id'] ?? null);

        $total = $payload['unit_price'] * (int) $draft['quantity'];

        return Inertia::render('public/special-programs/booking/review', [
            'draft' => $draft,
            'program' => [
                'id' => $program->id,
                'name' => $program->name,
                'program_type' => $program->program_type,
            ],
            'item' => $payload['item'],
            'ticket' => [
                'name' => $payload['ticket_name'],
                'price' => $payload['unit_price'],
            ],
            'pricing' => [
                'total' => $total,
            ],
            'snapClientKey' => (string) config('services.midtrans.client_key', ''),
            'snapScriptUrl' => config('services.midtrans.is_production')
                ? 'https://app.midtrans.com/snap/snap.js'
                : 'https://app.sandbox.midtrans.com/snap/snap.js',
            'snapToken' => null,
        ]);
    }

    public function confirm(Request $request, MidtransService $midtransService): Response|RedirectResponse
    {
        $draft = $request->session()->get('special_program_booking_draft');
        if (! $draft) {
            return redirect()->route('special-programs.search')->withErrors(['booking' => 'Data pemesanan tidak ditemukan.']);
        }

        $data = $request->validate([
            'guest_name' => ['required', 'string', 'max:255'],
            'guest_email' => ['required', 'email'],
        ]);

        $profilePhone = $request->user()?->phone;
        if (! $profilePhone) {
            return back()->withErrors(['guest_phone' => 'Nomor HP belum diisi di profil.']);
        }
        $data['guest_phone'] = $profilePhone;

        $program = SpecialProgram::query()->findOrFail($draft['program_id']);
        $payload = $this->resolveTicketPayload($draft['item_type'], (int) $draft['item_id'], $draft['ticket_id'] ?? null);

        $total = $payload['unit_price'] * (int) $draft['quantity'];

        try {
            [$booking, $snap] = DB::transaction(function () use ($request, $midtransService, $draft, $program, $payload, $data, $total) {
                $booking = SpecialProgramBooking::create([
                    'user_id' => $request->user()->id,
                    'special_program_id' => $program->id,
                    'item_type' => $draft['item_type'],
                    'item_id' => $draft['item_id'],
                    'item_name' => $payload['item']['title'],
                    'city_name' => $payload['item']['city_name'] ?? null,
                    'visit_date' => $draft['visit_date'],
                    'ticket_name' => $payload['ticket_name'],
                    'quantity' => $draft['quantity'],
                    'unit_price' => $payload['unit_price'],
                    'total_price' => $total,
                    'status' => 'pending_payment',
                    'payment_status' => 'pending',
                    'payment_deadline' => now()->addMinutes(self::PAYMENT_TTL_MINUTES),
                    'guest_name' => $data['guest_name'],
                    'guest_email' => $data['guest_email'],
                    'guest_phone' => $data['guest_phone'],
                ]);

                $snap = $this->createSnapPayment($booking, $midtransService);

                return [$booking, $snap];
            });
        } catch (\Throwable $exception) {
            return back()->withErrors(['booking' => 'Gagal memproses pembayaran. Silakan coba lagi.']);
        }

        UserNotification::create([
            'user_id' => $request->user()->id,
            'title' => 'Pemesanan special program berhasil',
            'message' => 'Pesanan kamu sudah dibuat. Silakan lanjutkan pembayaran.',
            'type' => 'special_program_booking_created',
            'data' => [
                'booking_id' => Crypt::encryptString((string) $booking->id),
                'category' => 'special_program',
            ],
        ]);

        UserNotification::create([
            'user_id' => $request->user()->id,
            'title' => 'Menunggu pembayaran special program',
            'message' => 'Ada pembayaran special program yang perlu diselesaikan.',
            'type' => 'special_program_payment_pending',
            'data' => [
                'booking_id' => Crypt::encryptString((string) $booking->id),
                'category' => 'special_program',
            ],
        ]);

        $request->session()->forget('special_program_booking_draft');

        return Inertia::render('public/special-programs/booking/review', [
            'draft' => $draft,
            'program' => [
                'id' => $program->id,
                'name' => $program->name,
                'program_type' => $program->program_type,
            ],
            'item' => $payload['item'],
            'ticket' => [
                'name' => $payload['ticket_name'],
                'price' => $payload['unit_price'],
            ],
            'pricing' => [
                'total' => $total,
            ],
            'snapClientKey' => (string) config('services.midtrans.client_key', ''),
            'snapScriptUrl' => config('services.midtrans.is_production')
                ? 'https://app.midtrans.com/snap/snap.js'
                : 'https://app.sandbox.midtrans.com/snap/snap.js',
            'snapToken' => $snap['token'] ?? null,
        ]);
    }

    public function payment(Request $request, string $booking, MidtransService $midtransService): Response
    {
        $booking = $this->resolveBooking($booking);
        if ((int) $booking->user_id !== (int) $request->user()->id) {
            abort(403);
        }

        if ($booking->payment_deadline && now()->greaterThan($booking->payment_deadline) && $booking->status === 'pending_payment') {
            $booking->update([
                'status' => 'expired',
                'payment_status' => 'expired',
            ]);
        }
        $booking->load('payments');

        if ($booking->status === 'pending_payment') {
            $latestPayment = $booking->payments()->latest()->first();
            if (! $latestPayment || empty($latestPayment->payload['token'])) {
                try {
                    $this->createSnapPayment($booking, $midtransService);
                    $booking->load('payments');
                } catch (\Throwable $exception) {
                    return Inertia::render('public/special-programs/booking/payment', [
                        'booking' => $this->buildPayload($booking),
                        'snapClientKey' => (string) config('services.midtrans.client_key', ''),
                        'snapScriptUrl' => config('services.midtrans.is_production')
                            ? 'https://app.midtrans.com/snap/snap.js'
                            : 'https://app.sandbox.midtrans.com/snap/snap.js',
                        'snapError' => 'Gagal menyiapkan pembayaran. Silakan coba lagi.',
                    ]);
                }
            }
        }

        return Inertia::render('public/special-programs/booking/payment', [
            'booking' => $this->buildPayload($booking),
            'snapClientKey' => (string) config('services.midtrans.client_key', ''),
            'snapScriptUrl' => config('services.midtrans.is_production')
                ? 'https://app.midtrans.com/snap/snap.js'
                : 'https://app.sandbox.midtrans.com/snap/snap.js',
            'snapError' => null,
        ]);
    }

    public function show(Request $request, string $booking): Response
    {
        $booking = $this->resolveBooking($booking);
        if ((int) $booking->user_id !== (int) $request->user()->id) {
            abort(403);
        }
        $booking->load('payments');

        $reviewUrl = $booking->special_program_id
            ? '/special-programs/'.Crypt::encryptString((string) $booking->special_program_id)
            : null;

        return Inertia::render('public/special-programs/booking/show', [
            'booking' => array_merge($this->buildPayload($booking), [
                'review' => [
                    'can_review' => ProductReviewService::hasUsedBooking($request->user()->id, 'special_program', (int) $booking->special_program_id),
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

        $filename = sprintf('tiket-special-program-%s.pdf', $booking->id);

        return \Spatie\LaravelPdf\Facades\Pdf::view('special-program-ticket', [
            'booking' => $booking,
        ])->download($filename);
    }

    private function resolveTicketPayload(string $itemType, int $itemId, ?int $ticketId): array
    {
        if ($itemType === 'hotel') {
            $hotel = Hotel::query()->with('city', 'roomTypes')->findOrFail($itemId);
            $roomType = $hotel->roomTypes()->orderBy('base_price')->first();
            return [
                'item' => [
                    'title' => $hotel->name,
                    'city_name' => $hotel->city?->name,
                ],
                'ticket_id' => null,
                'ticket_name' => 'Booking Hotel',
                'unit_price' => $roomType ? (int) $roomType->base_price : 0,
            ];
        }

        if ($itemType === 'event') {
            $event = Event::query()->findOrFail($itemId);
            $ticket = $ticketId
                ? $event->tickets()->where('id', $ticketId)->firstOrFail()
                : $event->tickets()->firstOrFail();
            return [
                'item' => [
                    'title' => $event->title,
                    'city_name' => $this->resolveCityName($event->city_code),
                ],
                'ticket_id' => $ticket->id,
                'ticket_name' => $ticket->name,
                'unit_price' => (int) $ticket->price,
            ];
        }

        $destination = MitraWisataOnboarding::query()->findOrFail($itemId);
        $ticket = $ticketId
            ? WisataTicket::query()
                ->where('mitra_wisata_onboarding_id', $destination->id)
                ->where('id', $ticketId)
                ->firstOrFail()
            : WisataTicket::query()
                ->where('mitra_wisata_onboarding_id', $destination->id)
                ->firstOrFail();
        return [
            'item' => [
                'title' => $destination->destination_name,
                'city_name' => $this->resolveCityName($destination->city_code),
            ],
            'ticket_id' => $ticket->id,
            'ticket_name' => $ticket->name,
            'unit_price' => (int) $ticket->price,
        ];
    }

    private function resolveCityName(?string $cityCode): ?string
    {
        if (! $cityCode) {
            return null;
        }

        return DB::table('regencies')->where('code', $cityCode)->value('name');
    }

    private function buildSnapPayload(SpecialProgramBooking $booking, string $orderId): array
    {
        return [
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => (int) $booking->total_price,
            ],
            'expiry' => [
                'start_time' => now()->format('Y-m-d H:i:s O'),
                'unit' => 'hours',
                'duration' => 24,
            ],
            'item_details' => [
                [
                    'id' => (string) $booking->id,
                    'price' => (int) $booking->unit_price,
                    'quantity' => (int) $booking->quantity,
                    'name' => $booking->ticket_name ?? $booking->item_name,
                ],
            ],
            'customer_details' => [
                'first_name' => $booking->guest_name,
                'email' => $booking->guest_email,
                'phone' => $booking->guest_phone,
            ],
        ];
    }

    private function createSnapPayment(SpecialProgramBooking $booking, MidtransService $midtransService): array
    {
        $latestPayment = $booking->payments()->latest()->first();
        if ($latestPayment && $latestPayment->status === 'pending') {
            $existingPayload = (array) ($latestPayment->payload ?? []);
            if (! empty($existingPayload['token'])) {
                return $existingPayload;
            }
        }

        $orderId = sprintf('SPP-%s-%s', $booking->id, now()->format('YmdHis'));
        $payload = $this->buildSnapPayload($booking, $orderId);
        $snap = $midtransService->snap($payload);

        $payment = SpecialProgramPayment::create([
            'special_program_booking_id' => $booking->id,
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

    private function resolveBooking(string $booking): SpecialProgramBooking
    {
        try {
            $id = Crypt::decryptString($booking);
        } catch (\Throwable $exception) {
            abort(404);
        }

        return SpecialProgramBooking::query()->findOrFail($id);
    }

    private function buildPayload(SpecialProgramBooking $booking): array
    {
        $payment = $booking->payments()->latest()->first();

        return [
            'id' => $booking->id,
            'encrypted_id' => Crypt::encryptString((string) $booking->id),
            'program' => [
                'id' => $booking->special_program_id,
                'name' => $booking->program?->name,
            ],
            'item' => [
                'type' => $booking->item_type,
                'name' => $booking->item_name,
                'city_name' => $booking->city_name,
            ],
            'quantity' => $booking->quantity,
            'unit_price' => $booking->unit_price,
            'total' => $booking->total_price,
            'status' => $booking->status,
            'payment_status' => $booking->payment_status,
            'payment_deadline' => $booking->payment_deadline?->toIso8601String(),
            'ticket_name' => $booking->ticket_name,
            'guest' => [
                'name' => $booking->guest_name,
                'email' => $booking->guest_email,
                'phone' => $booking->guest_phone,
            ],
            'payment' => $payment ? [
                'status' => $payment->status,
                'payload' => $payment->payload,
            ] : null,
        ];
    }
}
