<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\BookingRoom;
use App\Models\Hotel;
use App\Models\Payment;
use App\Models\RoomType;
use App\Models\SystemSetting;
use App\Models\UserNotification;
use App\Models\Voucher;
use App\Services\BookingService;
use App\Services\MidtransService;
use Spatie\LaravelPdf\Facades\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class HotelBookingController extends Controller
{
    private const PAYMENT_TTL_MINUTES = 15;

    public function index(Request $request): JsonResponse
    {
        $bookings = Booking::query()
            ->where('user_id', $request->user()->id)
            ->with(['hotel', 'rooms.roomType', 'payments'])
            ->latest()
            ->get()
            ->map(fn (Booking $booking) => $this->bookingPayload($booking));

        return response()->json([
            'bookings' => $bookings,
        ]);
    }

    public function quote(Request $request, BookingService $bookingService): JsonResponse
    {
        $data = $request->validate([
            'hotel_id' => ['required', 'string'],
            'room_type_id' => ['required', 'string'],
            'check_in' => ['required', 'date'],
            'check_out' => ['required', 'date', 'after:check_in'],
            'rooms' => ['required', 'integer', 'min:1', 'max:10'],
            'guests' => ['required', 'integer', 'min:1', 'max:20'],
            'children' => ['nullable', 'integer', 'min:0', 'max:20'],
            'children_ages' => ['nullable', 'array'],
            'children_ages.*' => ['integer', 'min:0', 'max:17'],
            'voucher_code' => ['nullable', 'string', 'max:50'],
        ]);

        $hotelId = $this->resolveEntityId($data['hotel_id']);
        if (! $hotelId) {
            return $this->invalidIdResponse('hotel_id');
        }
        $roomTypeId = $this->resolveEntityId($data['room_type_id']);
        if (! $roomTypeId) {
            return $this->invalidIdResponse('room_type_id');
        }
        $data['hotel_id'] = $hotelId;
        $data['room_type_id'] = $roomTypeId;

        $childrenCount = (int) ($data['children'] ?? 0);
        $childrenAges = $data['children_ages'] ?? [];

        $roomType = RoomType::query()->findOrFail($data['room_type_id']);
        if ((int) $roomType->hotel_id !== (int) $data['hotel_id']) {
            return response()->json(['message' => 'Tipe kamar tidak sesuai hotel.'], 422);
        }

        $hotel = Hotel::query()->with('taxes')->findOrFail($data['hotel_id']);

        try {
            $pricing = $bookingService->calculatePricing(
                $roomType,
                $data['check_in'],
                $data['check_out'],
                (int) $data['rooms'],
                (int) $data['guests'],
                $childrenCount,
                $childrenAges
            );
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        $voucherPayload = null;
        $discountAmount = 0;
        if (! empty($data['voucher_code'])) {
            $voucher = $this->resolveVoucher($data['voucher_code'], (int) $data['hotel_id']);
            if (! $voucher) {
                return response()->json(['message' => 'Voucher tidak valid atau sudah habis.'], 422);
            }

            if ($voucher->min_transaction > 0 && $pricing['subtotal'] < $voucher->min_transaction) {
                return response()->json(['message' => 'Minimum transaksi belum memenuhi syarat voucher.'], 422);
            }

            if (! $this->canUseVoucherForUser($voucher, (int) $request->user()->id)) {
                return response()->json(['message' => 'Voucher sudah mencapai limit penggunaan untuk akun ini.'], 422);
            }

            $discountAmount = $this->calculateDiscountAmount($pricing['subtotal'], $voucher);
            $voucherPayload = [
                'code' => $voucher->code,
                'discount_type' => $voucher->discount_type,
                'discount_value' => $voucher->discount_value,
                'discount_amount' => $discountAmount,
            ];
        }

        $taxableSubtotal = max(0, $pricing['subtotal'] - $discountAmount);
        [$taxItems, $taxTotal] = $this->buildTaxBreakdown($hotel, $taxableSubtotal);
        $serviceFee = $this->resolveServiceFee();
        $total = max(0, $taxableSubtotal + $taxTotal + $serviceFee);

        return response()->json([
            'pricing' => [
                'nights' => $pricing['nights'],
                'base_subtotal' => $pricing['base_subtotal'] ?? $pricing['subtotal'],
                'extra_adults' => $pricing['extra_adults'] ?? 0,
                'extra_children' => $pricing['extra_children'] ?? 0,
                'extra_beds' => $pricing['extra_beds'] ?? 0,
                'extra_adult_fee' => $pricing['extra_adult_fee'] ?? 0,
                'extra_child_fee' => $pricing['extra_child_fee'] ?? 0,
                'extra_bed_fee' => $pricing['extra_bed_fee'] ?? 0,
                'subtotal' => $pricing['subtotal'],
                'discount_amount' => $discountAmount,
                'service_fee' => $serviceFee,
                'tax_total' => $taxTotal,
                'taxes' => $taxItems,
                'total' => $total,
            ],
            'guest_policy' => [
                'max_guest' => $pricing['max_guest'] ?? null,
                'included_adults' => $pricing['included_adults'] ?? null,
                'extra_bed_max' => $pricing['extra_bed_max'] ?? null,
                'child_age_max' => $pricing['child_age_max'] ?? null,
            ],
            'voucher' => $voucherPayload,
        ]);
    }

    public function store(Request $request, BookingService $bookingService): JsonResponse
    {
        $data = $request->validate([
            'hotel_id' => ['required', 'string'],
            'room_type_id' => ['required', 'string'],
            'check_in' => ['required', 'date'],
            'check_out' => ['required', 'date', 'after:check_in'],
            'rooms' => ['required', 'integer', 'min:1', 'max:10'],
            'guests' => ['required', 'integer', 'min:1', 'max:20'],
            'children' => ['nullable', 'integer', 'min:0', 'max:20'],
            'children_ages' => ['nullable', 'array'],
            'children_ages.*' => ['integer', 'min:0', 'max:17'],
            'guest_name' => ['required', 'string', 'max:255'],
            'guest_email' => ['required', 'email', 'max:255'],
            'special_request' => ['nullable', 'string', 'max:1000'],
            'voucher_code' => ['nullable', 'string', 'max:50'],
        ]);

        $hotelId = $this->resolveEntityId($data['hotel_id']);
        if (! $hotelId) {
            return $this->invalidIdResponse('hotel_id');
        }
        $roomTypeId = $this->resolveEntityId($data['room_type_id']);
        if (! $roomTypeId) {
            return $this->invalidIdResponse('room_type_id');
        }
        $data['hotel_id'] = $hotelId;
        $data['room_type_id'] = $roomTypeId;

        $profilePhone = $request->user()?->phone;
        if (! $profilePhone) {
            return response()->json(['message' => 'Nomor HP belum diisi di profil.'], 422);
        }
        $data['guest_phone'] = $profilePhone;

        $childrenCount = (int) ($data['children'] ?? 0);
        $childrenAges = $data['children_ages'] ?? [];

        $roomType = RoomType::query()->findOrFail($data['room_type_id']);
        if ((int) $roomType->hotel_id !== (int) $data['hotel_id']) {
            return response()->json(['message' => 'Tipe kamar tidak sesuai hotel.'], 422);
        }

        $hotel = Hotel::query()->with('taxes')->findOrFail($data['hotel_id']);

        try {
            $booking = DB::transaction(function () use ($request, $data, $roomType, $bookingService, $hotel, $childrenCount, $childrenAges) {
                $pricing = $bookingService->calculatePricing(
                    $roomType,
                    $data['check_in'],
                    $data['check_out'],
                    (int) $data['rooms'],
                    (int) $data['guests'],
                    $childrenCount,
                    $childrenAges
                );

                $voucher = null;
                $discountAmount = 0;
                if (! empty($data['voucher_code'])) {
                    $voucher = Voucher::query()
                        ->where('code', strtoupper($data['voucher_code']))
                        ->lockForUpdate()
                        ->first();

                    if (! $voucher || ! $this->isVoucherValid($voucher, (int) $data['hotel_id'])) {
                        throw new RuntimeException('Voucher tidak valid atau kuota habis.');
                    }

                    if ($voucher->min_transaction > 0 && $pricing['subtotal'] < $voucher->min_transaction) {
                        throw new RuntimeException('Minimum transaksi belum memenuhi syarat voucher.');
                    }

                    if (! $this->canUseVoucherForUser($voucher, (int) $request->user()->id)) {
                        throw new RuntimeException('Voucher sudah mencapai limit penggunaan untuk akun ini.');
                    }

                    $discountAmount = $this->calculateDiscountAmount($pricing['subtotal'], $voucher);
                    if ($voucher->quota_total > 0 && $voucher->quota_used >= $voucher->quota_total) {
                        throw new RuntimeException('Voucher sudah habis.');
                    }
                    $voucher->quota_used = (int) $voucher->quota_used + 1;
                    $voucher->save();
                }

                $bookingService->reserveInventory(
                    $roomType,
                    $data['check_in'],
                    $data['check_out'],
                    (int) $data['rooms'],
                    false
                );

                $taxableSubtotal = max(0, $pricing['subtotal'] - $discountAmount);
                [$taxItems, $taxTotal] = $this->buildTaxBreakdown($hotel, $taxableSubtotal);
                $serviceFee = $this->resolveServiceFee();
                $total = max(0, $taxableSubtotal + $taxTotal + $serviceFee);

                $booking = Booking::create([
                    'user_id' => $request->user()->id,
                    'hotel_id' => $data['hotel_id'],
                    'voucher_id' => $voucher?->id,
                    'voucher_code' => $voucher?->code,
                    'check_in' => $data['check_in'],
                    'check_out' => $data['check_out'],
                    'nights' => $pricing['nights'],
                    'rooms_count' => (int) $data['rooms'],
                    'guests_count' => (int) $data['guests'],
                    'children_count' => $childrenCount,
                    'children_ages' => $childrenAges,
                    'extra_adults' => $pricing['extra_adults'] ?? 0,
                    'extra_children' => $pricing['extra_children'] ?? 0,
                    'extra_beds' => $pricing['extra_beds'] ?? 0,
                    'extra_adult_fee' => $pricing['extra_adult_fee'] ?? 0,
                    'extra_child_fee' => $pricing['extra_child_fee'] ?? 0,
                    'extra_bed_fee' => $pricing['extra_bed_fee'] ?? 0,
                    'subtotal' => $pricing['subtotal'],
                    'discount_type' => $voucher?->discount_type,
                    'discount_value' => $voucher?->discount_value,
                    'discount_amount' => $discountAmount > 0 ? $discountAmount : null,
                    'service_fee' => $serviceFee,
                    'tax_total' => $taxTotal,
                    'tax_details' => $taxItems,
                    'total' => $total,
                    'status' => 'pending_payment',
                    'payment_deadline' => now()->addMinutes(self::PAYMENT_TTL_MINUTES),
                    'guest_name' => $data['guest_name'],
                    'guest_email' => $data['guest_email'],
                    'guest_phone' => $data['guest_phone'],
                    'special_request' => $data['special_request'] ?? null,
                ]);

                BookingRoom::create([
                    'booking_id' => $booking->id,
                    'room_type_id' => $roomType->id,
                    'rooms_count' => (int) $data['rooms'],
                    'price_per_night' => (int) round($roomType->base_price),
                    'subtotal' => $pricing['base_subtotal'] ?? $pricing['subtotal'],
                ]);

                return $booking;
            });
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        UserNotification::create([
            'user_id' => $request->user()->id,
            'title' => 'Pemesanan berhasil dibuat',
            'message' => 'Pesanan kamu sudah kami simpan. Silakan lanjutkan pembayaran agar booking dikonfirmasi.',
            'type' => 'booking_created',
            'data' => [
                'booking_id' => $this->encryptId($booking->id),
                'category' => 'hotel',
            ],
        ]);

        UserNotification::create([
            'user_id' => $request->user()->id,
            'title' => 'Menunggu pembayaran',
            'message' => 'Ada pembayaran yang perlu diselesaikan agar booking aktif.',
            'type' => 'payment_pending',
            'data' => [
                'booking_id' => $this->encryptId($booking->id),
                'category' => 'hotel',
            ],
        ]);

        $booking->load('hotel', 'rooms.roomType', 'payments');

        return response()->json([
            'booking' => $this->bookingPayload($booking),
        ], 201);
    }

    public function show(Request $request, string $booking): JsonResponse
    {
        $booking = $this->resolveBooking($booking);

        if ((int) $booking->user_id !== (int) $request->user()->id) {
            return response()->json(['message' => 'Booking tidak ditemukan.'], 404);
        }

        if ($booking->isExpired()) {
            $this->expireBooking($booking);
        }

        $booking->load('hotel', 'rooms.roomType', 'payments');

        return response()->json([
            'booking' => $this->bookingPayload($booking),
        ]);
    }

    public function pay(Request $request, string $booking, MidtransService $midtransService): JsonResponse
    {
        $booking = $this->resolveBooking($booking);

        if ((int) $booking->user_id !== (int) $request->user()->id) {
            return response()->json(['message' => 'Booking tidak ditemukan.'], 404);
        }

        if ($booking->isExpired()) {
            $this->expireBooking($booking);
            return response()->json(['message' => 'Booking sudah kedaluwarsa.'], 422);
        }

        if ($booking->status !== 'pending_payment') {
            $booking->load('hotel', 'rooms.roomType', 'payments');

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

        $orderId = sprintf('INDOTIX-%s-%s', $booking->id, now()->format('YmdHis'));
        $payload = $this->buildSnapPayload($booking, $orderId);

        try {
            $charge = $midtransService->snap($payload);
        } catch (\Throwable $exception) {
            return response()->json(['message' => 'Gagal menghubungi server pembayaran. Silakan coba lagi.'], 500);
        }

        $payment = Payment::create([
            'booking_id' => $booking->id,
            'provider' => 'midtrans',
            'status' => 'pending',
            'gross_amount' => (int) $booking->total,
            'payment_type' => 'snap',
            'transaction_id' => $charge['transaction_id'] ?? null,
            'order_id' => $orderId,
            'payload' => $charge,
        ]);

        $booking->update([
            'midtrans_order_id' => $payment->order_id,
            'payment_status' => $payment->status,
        ]);

        UserNotification::create([
            'user_id' => $booking->user_id,
            'title' => 'Instruksi pembayaran dibuat',
            'message' => 'Instruksi pembayaran sudah tersedia. Segera selesaikan pembayaran agar pesanan kamu aktif.',
            'type' => 'payment_pending',
            'data' => [
                'booking_id' => $this->encryptId($booking->id),
                'category' => 'hotel',
            ],
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
            return response()->json(['message' => 'Booking tidak ditemukan.'], 404);
        }

        if ($booking->status !== 'pending_payment') {
            return response()->json(['message' => 'Pesanan tidak dapat dibatalkan.'], 422);
        }

        $booking->load('rooms.roomType');
        foreach ($booking->rooms as $room) {
            if (! $room->roomType) {
                continue;
            }
            app(BookingService::class)->releaseInventory(
                $room->roomType,
                $booking->check_in->toDateString(),
                $booking->check_out->toDateString(),
                $room->rooms_count
            );
        }

        $booking->status = 'cancelled';
        $booking->payment_status = 'cancelled';
        $booking->save();

        UserNotification::create([
            'user_id' => $booking->user_id,
            'title' => 'Pesanan dibatalkan',
            'message' => 'Pesanan kamu berhasil dibatalkan dan kamar telah dilepas.',
            'type' => 'booking_cancelled',
            'data' => [
                'booking_id' => $this->encryptId($booking->id),
                'category' => 'hotel',
            ],
        ]);

        return response()->json([
            'booking' => $this->bookingPayload($booking),
        ]);
    }

    public function invoice(Request $request, string $booking)
    {
        $booking = $this->resolveBooking($booking);

        if ((int) $booking->user_id !== (int) $request->user()->id) {
            return response()->json(['message' => 'Booking tidak ditemukan.'], 404);
        }

        $booking->load('hotel', 'rooms.roomType');
        $filename = sprintf('invoice-%s.pdf', $booking->id);

        return Pdf::view('invoice', [
            'booking' => $booking,
        ])->download($filename);
    }

    private function bookingPayload(Booking $booking): array
    {
        $latestPayment = $booking->payments()->latest()->first();

        return [
            'encrypted_id' => $this->encryptId($booking->id),
            'id' => $booking->id,
            'status' => $booking->status,
            'payment_status' => $booking->payment_status,
            'payment_deadline' => $booking->payment_deadline?->toIso8601String(),
            'hotel' => [
                'name' => $booking->hotel?->name,
                'address' => $booking->hotel?->address,
            ],
            'check_in' => $booking->check_in?->toDateString(),
            'check_out' => $booking->check_out?->toDateString(),
            'nights' => $booking->nights,
            'rooms_count' => $booking->rooms_count,
            'guests_count' => $booking->guests_count,
            'children_count' => $booking->children_count ?? 0,
            'children_ages' => $booking->children_ages ?? [],
            'extra_adults' => $booking->extra_adults ?? 0,
            'extra_children' => $booking->extra_children ?? 0,
            'extra_beds' => $booking->extra_beds ?? 0,
            'extra_adult_fee' => $booking->extra_adult_fee ?? 0,
            'extra_child_fee' => $booking->extra_child_fee ?? 0,
            'extra_bed_fee' => $booking->extra_bed_fee ?? 0,
            'total' => $booking->total,
            'subtotal' => $booking->subtotal,
            'discount_amount' => $booking->discount_amount,
            'service_fee' => $booking->service_fee ?? 0,
            'tax_total' => $booking->tax_total ?? 0,
            'taxes' => $booking->tax_details ?? [],
            'voucher_code' => $booking->voucher_code,
            'guest_name' => $booking->guest_name,
            'guest_email' => $booking->guest_email,
            'guest_phone' => $booking->guest_phone,
            'special_request' => $booking->special_request,
            'rooms' => $booking->rooms->map(fn (BookingRoom $room) => [
                'room_type' => $room->roomType?->name,
                'rooms_count' => $room->rooms_count,
                'price_per_night' => $room->price_per_night,
                'subtotal' => $room->subtotal,
            ]),
            'payment' => $latestPayment ? [
                'status' => $latestPayment->status,
                'payment_type' => $latestPayment->payment_type,
                'payload' => $latestPayment->payload,
            ] : null,
            'qr_data' => $this->buildQrData('HOTEL', $this->encryptId($booking->id)),
            'qr_url' => $this->buildQrUrl('HOTEL', $this->encryptId($booking->id)),
        ];
    }

    private function buildSnapPayload(Booking $booking, string $orderId): array
    {
        return [
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => (int) $booking->total,
            ],
            'customer_details' => [
                'first_name' => $booking->guest_name,
                'email' => $booking->guest_email,
                'phone' => $booking->guest_phone,
            ],
            'item_details' => [
                [
                    'id' => (string) $booking->id,
                    'price' => (int) $booking->total,
                    'quantity' => 1,
                    'name' => 'Booking Hotel '.$booking->hotel?->name,
                ],
            ],
        ];
    }

    private function resolveServiceFee(): int
    {
        $value = SystemSetting::query()
            ->where('key', 'service_fee')
            ->value('value');

        if ($value === null) {
            return 0;
        }

        return (int) round((float) $value);
    }

    private function buildTaxBreakdown(Hotel $hotel, int $taxableSubtotal): array
    {
        $items = $hotel->taxes
            ->map(function ($tax) use ($taxableSubtotal) {
                $rate = (float) $tax->rate;
                $amount = (int) round($taxableSubtotal * ($rate / 100));
                return [
                    'name' => $tax->name,
                    'rate' => $rate,
                    'amount' => $amount,
                ];
            })
            ->values()
            ->all();

        $total = array_sum(array_map(fn ($item) => $item['amount'], $items));

        return [$items, $total];
    }

    private function expireBooking(Booking $booking): void
    {
        if ($booking->status !== 'pending_payment') {
            return;
        }

        $room = $booking->rooms()->first();
        if ($room && $room->roomType) {
            app(BookingService::class)->releaseInventory(
                $room->roomType,
                $booking->check_in->toDateString(),
                $booking->check_out->toDateString(),
                $room->rooms_count
            );
        }

        $booking->status = 'expired';
        $booking->payment_status = 'expired';
        $booking->save();

        UserNotification::create([
            'user_id' => $booking->user_id,
            'title' => 'Pesanan kedaluwarsa',
            'message' => 'Batas waktu pembayaran terlewat. Pesanan kamu otomatis kedaluwarsa.',
            'type' => 'booking_expired',
            'data' => [
                'booking_id' => $this->encryptId($booking->id),
                'category' => 'hotel',
            ],
        ]);
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

    private function resolveBooking(string $encryptedId): Booking
    {
        if (ctype_digit($encryptedId)) {
            $id = (int) $encryptedId;
        } else {
            try {
                $id = Crypt::decryptString($encryptedId);
            } catch (\Throwable $exception) {
                abort(404);
            }
        }

        return Booking::query()->findOrFail($id);
    }

    private function encryptId(int $id): string
    {
        return Crypt::encryptString((string) $id);
    }

    private function resolveVoucher(string $code, int $hotelId): ?Voucher
    {
        $voucher = Voucher::query()
            ->where('code', strtoupper($code))
            ->where('is_active', true)
            ->first();

        if (! $voucher) {
            return null;
        }

        return $this->isVoucherValid($voucher, $hotelId) ? $voucher : null;
    }

    private function isVoucherValid(Voucher $voucher, int $hotelId): bool
    {
        $today = now()->toDateString();
        if ($voucher->starts_at && $voucher->starts_at->toDateString() > $today) {
            return false;
        }
        if ($voucher->ends_at && $voucher->ends_at->toDateString() < $today) {
            return false;
        }
        if ($voucher->hotel_id && (int) $voucher->hotel_id !== $hotelId) {
            return false;
        }
        if ($voucher->quota_total > 0 && $voucher->quota_used >= $voucher->quota_total) {
            return false;
        }

        return true;
    }

    private function calculateDiscountAmount(int $subtotal, Voucher $voucher): int
    {
        if ($voucher->discount_type === 'fixed') {
            return min($subtotal, (int) $voucher->discount_value);
        }

        return (int) round($subtotal * ((int) $voucher->discount_value / 100));
    }

    private function canUseVoucherForUser(Voucher $voucher, int $userId): bool
    {
        if ((int) $voucher->max_per_user_per_day <= 0) {
            return true;
        }

        $query = Booking::query()
            ->where('voucher_id', $voucher->id)
            ->where('user_id', $userId);

        if ($voucher->starts_at) {
            $query->whereDate('created_at', '>=', $voucher->starts_at->toDateString());
        }
        if ($voucher->ends_at) {
            $query->whereDate('created_at', '<=', $voucher->ends_at->toDateString());
        }

        $count = $query->count();

        return $count < (int) $voucher->max_per_user_per_day;
    }
}
