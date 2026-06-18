<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SpecialProgram;
use App\Models\SpecialProgramBooking;
use App\Models\SpecialProgramInventory;
use App\Models\SpecialProgramPayment;
use App\Models\SpecialProgramVariant;
use App\Models\UserNotification;
use App\Services\MidtransService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class SpecialProgramBookingController extends Controller
{
    private const PAYMENT_TTL_MINUTES = 15;

    public function index(Request $request): JsonResponse
    {
        $bookings = SpecialProgramBooking::query()
            ->where('user_id', $request->user()->id)
            ->with(['program', 'variant', 'payments'])
            ->latest()
            ->get()
            ->map(fn (SpecialProgramBooking $booking) => $this->bookingPayload($booking));

        return response()->json([
            'bookings' => $bookings,
        ]);
    }

    public function quote(Request $request): JsonResponse
    {
        $data = $request->validate([
            'program_id' => ['required', 'string'],
            'variant_id' => ['nullable', 'string'],
            'date' => ['required', 'date'],
            'quantity' => ['required', 'integer', 'min:1', 'max:999'],
        ]);

        $programId = $this->resolveEntityId($data['program_id']);
        if (! $programId) {
            return $this->invalidIdResponse('program_id');
        }
        $variantId = null;
        if (! empty($data['variant_id'])) {
            $variantId = $this->resolveEntityId($data['variant_id']);
            if (! $variantId) {
                return $this->invalidIdResponse('variant_id');
            }
        }
        $data['program_id'] = $programId;
        $data['variant_id'] = $variantId;

        $program = SpecialProgram::query()
            ->where('id', $data['program_id'])
            ->where('is_active', true)
            ->first();

        if (! $program) {
            return response()->json(['message' => 'Program tidak tersedia.'], 422);
        }

        $variant = null;
        if ($data['variant_id'] ?? null) {
            $variant = SpecialProgramVariant::query()
                ->where('id', $data['variant_id'])
                ->where('special_program_id', $program->id)
                ->first();

            if (! $variant) {
                return response()->json(['message' => 'Variant tidak sesuai paket.'], 422);
            }
        }

        $inventory = $this->resolveInventory($program, $data['date']);
        if ($program->category === 'travel' && ! $inventory) {
            return response()->json(['message' => 'Tanggal belum tersedia.'], 422);
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
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        $unitPrice = (int) ($variant?->price ?? $program->base_price);
        $total = $unitPrice * (int) $data['quantity'];

        return response()->json([
            'pricing' => [
                'unit_price' => $unitPrice,
                'quantity' => (int) $data['quantity'],
                'total' => $total,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'program_id' => ['required', 'string'],
            'variant_id' => ['nullable', 'string'],
            'date' => ['required', 'date'],
            'quantity' => ['required', 'integer', 'min:1', 'max:999'],
            'guest_name' => ['required', 'string', 'max:255'],
            'guest_email' => ['required', 'email', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $programId = $this->resolveEntityId($data['program_id']);
        if (! $programId) {
            return $this->invalidIdResponse('program_id');
        }
        $variantId = null;
        if (! empty($data['variant_id'])) {
            $variantId = $this->resolveEntityId($data['variant_id']);
            if (! $variantId) {
                return $this->invalidIdResponse('variant_id');
            }
        }
        $data['program_id'] = $programId;
        $data['variant_id'] = $variantId;

        $profilePhone = $request->user()?->phone;
        if (! $profilePhone) {
            return response()->json(['message' => 'Nomor HP belum diisi di profil.'], 422);
        }
        $data['guest_phone'] = $profilePhone;

        try {
            $booking = DB::transaction(function () use ($request, $data) {
                $program = SpecialProgram::query()
                    ->lockForUpdate()
                    ->where('id', $data['program_id'])
                    ->where('is_active', true)
                    ->first();

                if (! $program) {
                    throw new RuntimeException('Program tidak tersedia.');
                }

                $variant = null;
                if (! empty($data['variant_id'])) {
                    $variant = SpecialProgramVariant::query()
                        ->lockForUpdate()
                        ->where('id', $data['variant_id'])
                        ->where('special_program_id', $program->id)
                        ->first();

                    if (! $variant) {
                        throw new RuntimeException('Variant tidak sesuai paket.');
                    }
                }

                $inventory = $this->resolveInventory($program, $data['date'], true);
                if ($program->category === 'travel' && ! $inventory) {
                    throw new RuntimeException('Tanggal belum tersedia.');
                }

                $this->ensureCapacity(
                    $program,
                    $variant,
                    $inventory,
                    $data['date'],
                    (int) $data['quantity'],
                    true,
                );

                $unitPrice = (int) ($variant?->price ?? $program->base_price);
                $totalPrice = $unitPrice * (int) $data['quantity'];

                return SpecialProgramBooking::create([
                    'user_id' => $request->user()->id,
                    'special_program_id' => $program->id,
                    'special_program_variant_id' => $variant?->id,
                    'item_type' => 'package',
                    'item_id' => $program->id,
                    'item_name' => $program->name,
                    'ticket_name' => $variant?->name,
                    'visit_date' => $data['date'],
                    'quantity' => $data['quantity'],
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
            return response()->json(['message' => $exception->getMessage()], 422);
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

        $booking->load(['program', 'variant', 'payments']);

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

        $booking->load(['program', 'variant', 'payments']);

        return response()->json([
            'booking' => $this->bookingPayload($booking),
        ]);
    }

    public function pay(Request $request, string $booking, MidtransService $midtransService): JsonResponse
    {
        $booking = $this->resolveBooking($booking);

        if ((int) $booking->user_id !== (int) $request->user()->id) {
            return response()->json(['message' => 'Data tidak ditemukan.'], 404);
        }

        if ($this->isExpired($booking)) {
            $booking->update(['status' => 'expired', 'payment_status' => 'expired']);

            return response()->json(['message' => 'Booking sudah kedaluwarsa.'], 422);
        }

        if ($booking->status !== 'pending_payment') {
            $booking->load(['program', 'variant', 'payments']);

            return response()->json([
                'booking' => $this->bookingPayload($booking),
            ]);
        }

        if ($booking->payments()->where('status', 'pending')->exists()) {
            $payment = $booking->payments()->latest()->first();

            return response()->json([
                'payment' => [
                    'order_id' => $payment?->order_id,
                    'snap_token' => $payment?->payload['token'] ?? null,
                    'redirect_url' => $payment?->payload['redirect_url'] ?? null,
                    'payload' => $payment?->payload,
                ],
            ]);
        }

        $orderId = sprintf('SPECIAL-PROGRAM-%s-%s', $booking->id, now()->format('YmdHis'));
        $payload = $this->buildSnapPayload($booking, $orderId);

        try {
            $charge = $midtransService->snap($payload);
        } catch (\Throwable $exception) {
            Log::warning('Midtrans special program snap payment failed', [
                'booking_id' => $booking->id,
                'order_id' => $orderId,
                'message' => $exception->getMessage(),
            ]);

            return response()->json(['message' => 'Gagal menghubungi server pembayaran. Silakan coba lagi.'], 500);
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

        return response()->json([
            'payment' => [
                'order_id' => $payment->order_id,
                'snap_token' => $charge['token'] ?? null,
                'redirect_url' => $charge['redirect_url'] ?? null,
                'payload' => $charge,
            ],
        ]);
    }

    public function cancel(Request $request, string $booking): JsonResponse
    {
        $booking = $this->resolveBooking($booking);

        if ((int) $booking->user_id !== (int) $request->user()->id) {
            return response()->json(['message' => 'Data tidak ditemukan.'], 404);
        }

        if ($booking->status !== 'pending_payment') {
            return response()->json(['message' => 'Pesanan tidak dapat dibatalkan.'], 422);
        }

        $booking->update([
            'status' => 'cancelled',
            'payment_status' => 'cancelled',
        ]);

        UserNotification::create([
            'user_id' => $booking->user_id,
            'title' => 'Pesanan dibatalkan',
            'message' => 'Pesanan special program kamu berhasil dibatalkan.',
            'type' => 'special_program_booking_cancelled',
            'data' => [
                'booking_id' => $this->encryptId($booking->id),
                'type' => 'special_program',
                'category' => 'special_program',
            ],
        ]);

        $booking->load(['program', 'variant', 'payments']);

        return response()->json([
            'booking' => $this->bookingPayload($booking),
        ]);
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
            'variant' => $booking->variant ? [
                'id' => $booking->variant?->id,
                'name' => $booking->variant?->name,
            ] : null,
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

    private function resolveBooking(string $booking): SpecialProgramBooking
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
