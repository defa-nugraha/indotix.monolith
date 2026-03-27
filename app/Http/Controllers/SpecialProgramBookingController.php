<?php

namespace App\Http\Controllers;

use App\Models\SpecialProgram;
use App\Models\SpecialProgramBooking;
use App\Models\SpecialProgramInventory;
use App\Models\SpecialProgramPayment;
use App\Models\SpecialProgramVariant;
use App\Models\UserNotification;
use App\Services\MidtransService;
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
    private const PAYMENT_TTL_MINUTES = 15;

    public function prepare(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'program_id' => ['required', 'integer', 'exists:special_programs,id'],
            'variant_id' => ['nullable', 'integer', 'exists:special_program_variants,id'],
            'date' => ['required', 'date'],
            'quantity' => ['required', 'integer', 'min:1', 'max:999'],
        ]);

        $program = SpecialProgram::query()
            ->where('id', $data['program_id'])
            ->where('is_active', true)
            ->firstOrFail();

        $variant = null;
        if ($data['variant_id'] ?? null) {
            $variant = SpecialProgramVariant::query()
                ->where('id', $data['variant_id'])
                ->where('special_program_id', $program->id)
                ->first();

            if (! $variant) {
                return back()->withErrors(['variant_id' => 'Variant tidak sesuai paket.']);
            }
        }

        $inventory = $this->resolveInventory($program, $data['date']);
        if ($program->category === 'travel' && ! $inventory) {
            return back()->withErrors(['date' => 'Tanggal belum tersedia.']);
        }

        try {
            $this->ensureCapacity(
                $program,
                $variant,
                $inventory,
                $data['date'],
                (int) $data['quantity'],
            );
        } catch (RuntimeException $exception) {
            return back()->withErrors(['quantity' => $exception->getMessage()]);
        }

        $draft = [
            'program_id' => (int) $program->id,
            'variant_id' => $variant?->id,
            'date' => $data['date'],
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
            return redirect()
                ->route('special-programs.search')
                ->withErrors(['booking' => 'Data pemesanan tidak ditemukan.']);
        }

        $program = SpecialProgram::query()
            ->where('id', $draft['program_id'])
            ->where('is_active', true)
            ->firstOrFail();

        $variant = null;
        if (! empty($draft['variant_id'])) {
            $variant = SpecialProgramVariant::query()
                ->where('id', $draft['variant_id'])
                ->where('special_program_id', $program->id)
                ->first();
        }

        $unitPrice = (int) ($variant?->price ?? $program->base_price);
        $total = $unitPrice * (int) $draft['quantity'];

        return Inertia::render('public/special-programs/booking/review', [
            'draft' => $draft,
            'program' => [
                'id' => $program->id,
                'name' => $program->name,
                'category' => $program->category,
            ],
            'variant' => $variant ? [
                'id' => $variant->id,
                'name' => $variant->name,
                'price' => $variant->price,
            ] : null,
            'pricing' => [
                'unit_price' => $unitPrice,
                'total' => $total,
            ],
            'snapClientKey' => (string) config('services.midtrans.client_key', ''),
            'snapScriptUrl' => config('services.midtrans.is_production')
                ? 'https://app.midtrans.com/snap/snap.js'
                : 'https://app.sandbox.midtrans.com/snap/snap.js',
        ]);
    }

    public function confirm(Request $request, MidtransService $midtransService): Response|RedirectResponse|\Illuminate\Http\JsonResponse
    {
        $draft = $request->session()->get('special_program_booking_draft');
        if (! $draft) {
            return redirect()
                ->route('special-programs.search')
                ->withErrors(['booking' => 'Data pemesanan tidak ditemukan.']);
        }

        $data = $request->validate([
            'guest_name' => ['required', 'string', 'max:255'],
            'guest_email' => ['required', 'email', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $profilePhone = $request->user()?->phone;
        if (! $profilePhone) {
            return back()->withErrors(['guest_phone' => 'Nomor HP belum diisi di profil.']);
        }
        $data['guest_phone'] = $profilePhone;

        $existingBookingId = $request->session()->get('special_program_booking_pending');
        if ($existingBookingId) {
            $existingBooking = SpecialProgramBooking::query()->find($existingBookingId);
            if ($existingBooking) {
                if ($request->expectsJson()) {
                    $snap = $this->createSnapPayment($existingBooking, $midtransService);

                    return response()->json([
                        'booking_id' => $this->encryptId($existingBooking->id),
                        'snap_token' => $snap['token'] ?? null,
                        'redirect_url' => $snap['redirect_url'] ?? null,
                    ]);
                }

                $program = SpecialProgram::query()->findOrFail($draft['program_id']);
                $variant = null;
                if (! empty($draft['variant_id'])) {
                    $variant = SpecialProgramVariant::query()->find($draft['variant_id']);
                }
                $unitPrice = (int) ($variant?->price ?? $program->base_price);
                $total = $unitPrice * (int) $draft['quantity'];
                $snap = $this->createSnapPayment($existingBooking, $midtransService);

                return Inertia::render('public/special-programs/booking/review', [
                    'draft' => $draft,
                    'program' => [
                        'id' => $program->id,
                        'name' => $program->name,
                        'category' => $program->category,
                    ],
                    'variant' => $variant ? [
                        'id' => $variant->id,
                        'name' => $variant->name,
                        'price' => $variant->price,
                    ] : null,
                    'pricing' => [
                        'unit_price' => $unitPrice,
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

        try {
            $booking = DB::transaction(function () use ($draft, $data, $request) {
                $program = SpecialProgram::query()
                    ->lockForUpdate()
                    ->where('id', $draft['program_id'])
                    ->where('is_active', true)
                    ->firstOrFail();

                $variant = null;
                if (! empty($draft['variant_id'])) {
                    $variant = SpecialProgramVariant::query()
                        ->lockForUpdate()
                        ->where('id', $draft['variant_id'])
                        ->where('special_program_id', $program->id)
                        ->first();

                    if (! $variant) {
                        throw new RuntimeException('Variant tidak sesuai paket.');
                    }
                }

                $inventory = $this->resolveInventory($program, $draft['date'], true);
                if ($program->category === 'travel' && ! $inventory) {
                    throw new RuntimeException('Tanggal belum tersedia.');
                }

                $this->ensureCapacity(
                    $program,
                    $variant,
                    $inventory,
                    $draft['date'],
                    (int) $draft['quantity'],
                    true,
                );

                $unitPrice = (int) ($variant?->price ?? $program->base_price);
                $totalPrice = $unitPrice * (int) $draft['quantity'];

                return SpecialProgramBooking::create([
                    'user_id' => $request->user()->id,
                    'special_program_id' => $program->id,
                    'special_program_variant_id' => $variant?->id,
                    'item_type' => 'package',
                    'item_id' => $program->id,
                    'item_name' => $program->name,
                    'ticket_name' => $variant?->name,
                    'visit_date' => $draft['date'],
                    'quantity' => $draft['quantity'],
                    'unit_price' => $unitPrice,
                    'total_price' => $totalPrice,
                    'status' => 'pending_payment',
                    'payment_status' => 'pending',
                    'payment_deadline' => now()->addMinutes(self::PAYMENT_TTL_MINUTES),
                    'guest_name' => $data['guest_name'],
                    'guest_email' => $data['guest_email'],
                    'guest_phone' => $data['guest_phone'],
                    'notes' => $data['notes'] ?? null,
                ]);
            });
        } catch (RuntimeException $exception) {
            return back()->withErrors(['booking' => $exception->getMessage()]);
        }

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

        $program = SpecialProgram::query()->findOrFail($draft['program_id']);
        $variant = null;
        if (! empty($draft['variant_id'])) {
            $variant = SpecialProgramVariant::query()->find($draft['variant_id']);
        }
        $unitPrice = (int) ($variant?->price ?? $program->base_price);
        $total = $unitPrice * (int) $draft['quantity'];
        $snap = $this->createSnapPayment($booking, $midtransService);

        return Inertia::render('public/special-programs/booking/review', [
            'draft' => $draft,
            'program' => [
                'id' => $program->id,
                'name' => $program->name,
                'category' => $program->category,
            ],
            'variant' => $variant ? [
                'id' => $variant->id,
                'name' => $variant->name,
                'price' => $variant->price,
            ] : null,
            'pricing' => [
                'unit_price' => $unitPrice,
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

        if ($this->isExpired($booking)) {
            $booking->update([
                'status' => 'expired',
                'payment_status' => 'expired',
            ]);
        }

        $booking->load('program', 'variant', 'payments');

        return Inertia::render('public/special-programs/booking/payment', [
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

        if ($this->isExpired($booking)) {
            $booking->update(['status' => 'expired', 'payment_status' => 'expired']);
            return redirect()
                ->route('special-programs.booking.payment', ['booking' => $this->encryptId($booking->id)])
                ->withErrors(['payment' => 'Booking sudah kedaluwarsa.']);
        }

        if ($booking->status !== 'pending_payment') {
            return redirect()->route('special-programs.booking.payment', ['booking' => $this->encryptId($booking->id)]);
        }

        if ($booking->payments()->where('status', 'pending')->exists()) {
            return redirect()->route('special-programs.booking.payment', ['booking' => $this->encryptId($booking->id)]);
        }

        $orderId = sprintf('SPECIAL-PROGRAM-%s-%s', $booking->id, now()->format('YmdHis'));
        $payload = $this->buildSnapPayload($booking, $orderId);

        try {
            $charge = $midtransService->snap($payload);
        } catch (\Throwable $exception) {
            return redirect()
                ->route('special-programs.booking.payment', ['booking' => $this->encryptId($booking->id)])
                ->withErrors(['payment' => 'Gagal menghubungi server pembayaran. Silakan coba lagi.']);
        }

        $payment = SpecialProgramPayment::create([
            'special_program_booking_id' => $booking->id,
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

        return redirect()->route('special-programs.booking.payment', ['booking' => $this->encryptId($booking->id)]);
    }

    public function show(Request $request, string $booking): Response|RedirectResponse
    {
        $booking = $this->resolveBooking($booking);

        if ((int) $booking->user_id !== (int) $request->user()->id) {
            return redirect()->route('home');
        }

        $booking->load('program', 'variant');

        return Inertia::render('public/special-programs/booking/show', [
            'booking' => $this->bookingPayload($booking),
        ]);
    }

    public function ticket(Request $request, string $booking)
    {
        $booking = $this->resolveBooking($booking);

        if ((int) $booking->user_id !== (int) $request->user()->id) {
            return redirect()->route('home');
        }

        $booking->load('program', 'variant');

        $filename = sprintf('tiket-special-program-%s.pdf', $booking->id);
        $cacheAllowed = in_array($booking->status, ['paid', 'completed'], true);

        $qrImage = null;
        if ($cacheAllowed) {
            $qrUrl = $this->buildQrUrl('SPECIAL_PROGRAM', (string) ($booking->midtrans_order_id ?? $booking->id));
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

    private function resolveInventory(
        SpecialProgram $program,
        string $date,
        bool $useLock = false,
    ): ?SpecialProgramInventory {
        $query = $program->inventories()->whereDate('date', $date);
        if ($useLock) {
            $query->lockForUpdate();
        }

        return $query->first();
    }

    private function ensureCapacity(
        SpecialProgram $program,
        ?SpecialProgramVariant $variant,
        ?SpecialProgramInventory $inventory,
        string $date,
        int $quantity,
        bool $useLock = false,
    ): void {
        $statusScope = ['pending_payment', 'paid', 'completed'];

        $programQuery = SpecialProgramBooking::query()
            ->where('special_program_id', $program->id)
            ->whereDate('visit_date', $date)
            ->whereIn('status', $statusScope);

        if ($useLock) {
            $programQuery->lockForUpdate();
        }

        $programBooked = (int) $programQuery->sum('quantity');

        if ($program->capacity > 0 && $programBooked + $quantity > $program->capacity) {
            throw new RuntimeException('Kapasitas paket sudah penuh.');
        }

        if ($inventory && $inventory->capacity > 0 && $programBooked + $quantity > $inventory->capacity) {
            throw new RuntimeException('Kapasitas tanggal sudah penuh.');
        }

        if ($variant && $variant->capacity > 0) {
            $variantQuery = SpecialProgramBooking::query()
                ->where('special_program_id', $program->id)
                ->where('special_program_variant_id', $variant->id)
                ->whereDate('visit_date', $date)
                ->whereIn('status', $statusScope);

            if ($useLock) {
                $variantQuery->lockForUpdate();
            }

            $variantBooked = (int) $variantQuery->sum('quantity');
            if ($variantBooked + $quantity > $variant->capacity) {
                throw new RuntimeException('Kapasitas variant sudah penuh.');
            }
        }
    }

    private function bookingPayload(SpecialProgramBooking $booking): array
    {
        $latestPayment = $booking->payments()->latest()->first();

        return [
            'id' => $booking->id,
            'encrypted_id' => $this->encryptId($booking->id),
            'booking_code' => $booking->midtrans_order_id ?? (string) $booking->id,
            'visit_date' => $booking->visit_date?->toDateString(),
            'quantity' => $booking->quantity,
            'unit_price' => $booking->unit_price,
            'total' => $booking->total_price,
            'status' => $booking->status,
            'payment_status' => $booking->payment_status,
            'payment_deadline' => $booking->payment_deadline?->toIso8601String(),
            'program' => [
                'id' => $booking->program?->id,
                'name' => $booking->program?->name,
                'category' => $booking->program?->category,
            ],
            'variant' => [
                'id' => $booking->variant?->id,
                'name' => $booking->variant?->name,
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
            'qr_data' => $this->buildQrData('SPECIAL_PROGRAM', (string) ($booking->midtrans_order_id ?? $booking->id)),
            'qr_url' => $this->buildQrUrl('SPECIAL_PROGRAM', (string) ($booking->midtrans_order_id ?? $booking->id)),
        ];
    }

    private function buildSnapPayload(SpecialProgramBooking $booking, string $orderId): array
    {
        return [
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => (int) $booking->total_price,
            ],
            'item_details' => [
                [
                    'id' => (string) ($booking->special_program_variant_id ?? $booking->special_program_id),
                    'price' => (int) $booking->unit_price,
                    'quantity' => (int) $booking->quantity,
                    'name' => $booking->variant?->name ?? $booking->item_name ?? 'Special Program',
                ],
            ],
            'customer_details' => [
                'first_name' => $booking->guest_name,
                'email' => $booking->guest_email,
                'phone' => $booking->guest_phone,
            ],
        ];
    }

    private function createSnapPayment(
        SpecialProgramBooking $booking,
        MidtransService $midtransService,
    ): array {
        if ($booking->payments()->where('status', 'pending')->exists()) {
            return (array) ($booking->payments()->latest()->value('payload') ?? []);
        }

        $orderId = sprintf('SPECIAL-PROGRAM-%s-%s', $booking->id, now()->format('YmdHis'));
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

    private function encryptId(int $id): string
    {
        return Crypt::encryptString((string) $id);
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

    private function isExpired(SpecialProgramBooking $booking): bool
    {
        return $booking->status === 'pending_payment'
            && $booking->payment_deadline
            && $booking->payment_deadline->isPast();
    }
}
