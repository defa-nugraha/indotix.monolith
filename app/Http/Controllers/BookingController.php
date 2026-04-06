<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\BookingRoom;
use App\Models\Hotel;
use App\Models\Payment;
use App\Models\RoomType;
use App\Models\SystemSetting;
use App\Services\BookingService;
use App\Services\MidtransService;
use App\Services\ProductReviewService;
use App\Models\UserNotification;
use App\Models\Voucher;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Spatie\LaravelPdf\Facades\Pdf;

class BookingController extends Controller
{
    private const PAYMENT_TTL_MINUTES = 15;

    public function prepare(Request $request, BookingService $bookingService): RedirectResponse
    {
        $data = $request->validate([
            'hotel_id' => ['required', 'integer', 'exists:hotels,id'],
            'room_type_id' => ['required', 'integer', 'exists:room_types,id'],
            'check_in' => ['required', 'date'],
            'check_out' => ['required', 'date', 'after:check_in'],
            'rooms' => ['required', 'integer', 'min:1', 'max:10'],
            'guests' => ['required', 'integer', 'min:1', 'max:20'],
            'children' => ['nullable', 'integer', 'min:0', 'max:20'],
            'children_ages' => ['nullable', 'array'],
            'children_ages.*' => ['integer', 'min:0', 'max:17'],
        ]);

        $roomType = RoomType::query()->where('id', $data['room_type_id'])->firstOrFail();
        if ((int) $roomType->hotel_id !== (int) $data['hotel_id']) {
            return back()->withErrors(['room_type_id' => 'Tipe kamar tidak sesuai hotel.']);
        }

        $childrenCount = (int) ($data['children'] ?? 0);
        $childrenAges = $data['children_ages'] ?? [];

        try {
            $pricing = $bookingService->calculatePricing(
                $roomType,
                $data['check_in'],
                $data['check_out'],
                $data['rooms'],
                $data['guests'],
                $childrenCount,
                $childrenAges
            );
        } catch (RuntimeException $exception) {
            return back()->withErrors(['rooms' => $exception->getMessage()]);
        }

        $draft = [
            'hotel_id' => (int) $data['hotel_id'],
            'room_type_id' => (int) $data['room_type_id'],
            'check_in' => $data['check_in'],
            'check_out' => $data['check_out'],
            'rooms' => (int) $data['rooms'],
            'guests' => (int) $data['guests'],
            'children' => $childrenCount,
            'children_ages' => $childrenAges,
            'nights' => $pricing['nights'],
        ];

        $request->session()->put('booking_draft', $draft);

        if (! $request->user()) {
            return redirect()->route('login');
        }

        if ($request->user()->role !== 'user') {
            return redirect()->route('home');
        }

        return redirect()->route('booking.review');
    }

    public function review(Request $request, BookingService $bookingService): Response|RedirectResponse
    {
        $draft = $request->session()->get('booking_draft');
        if (! $draft) {
            return redirect()->route('home')->withErrors(['booking' => 'Data booking tidak ditemukan.']);
        }

        $hotel = Hotel::query()->with('city', 'taxes')->findOrFail($draft['hotel_id']);
        $roomType = RoomType::query()->findOrFail($draft['room_type_id']);
        $hotel = Hotel::query()->with('taxes')->findOrFail($draft['hotel_id']);
        if ((int) $roomType->hotel_id !== (int) $draft['hotel_id']) {
            return back()->withErrors(['rooms' => 'Tipe kamar tidak sesuai hotel.']);
        }

        try {
            $pricing = $bookingService->calculatePricing(
                $roomType,
                $draft['check_in'],
                $draft['check_out'],
                $draft['rooms'],
                $draft['guests'],
                $draft['children'] ?? 0,
                $draft['children_ages'] ?? []
            );
        } catch (RuntimeException $exception) {
            $request->session()->forget('booking_draft');

            return redirect()->route('public.hotels.show', $hotel)
                ->withErrors(['rooms' => $exception->getMessage()]);
        }

        $voucherPayload = null;
        $discountAmount = 0;
        if (! empty($draft['voucher_code'])) {
            $voucher = $this->resolveVoucher($draft['voucher_code'], (int) $draft['hotel_id']);
            $userId = (int) $request->user()->id;
            if (
                $voucher
                && ($voucher->min_transaction <= 0 || $pricing['subtotal'] >= $voucher->min_transaction)
                && $this->canUseVoucherForUser($voucher, $userId)
            ) {
                $discountAmount = $this->calculateDiscountAmount($pricing['subtotal'], $voucher);
                $voucherPayload = [
                    'code' => $voucher->code,
                    'discount_type' => $voucher->discount_type,
                    'discount_value' => $voucher->discount_value,
                    'discount_amount' => $discountAmount,
                ];
            } else {
                $this->clearVoucherDraft($request);
            }
        }

        $taxableSubtotal = max(0, $pricing['subtotal'] - $discountAmount);
        [$taxItems, $taxTotal] = $this->buildTaxBreakdown($hotel, $taxableSubtotal);
        $serviceFee = $this->resolveServiceFee();
        $total = max(0, $taxableSubtotal + $taxTotal + $serviceFee);

        return Inertia::render('public/booking/review', [
            'draft' => $draft,
            'hotel' => [
                'id' => $hotel->id,
                'name' => $hotel->name,
                'address' => $hotel->address,
                'city_name' => $hotel->city?->name,
                'star_rating' => $hotel->star_rating,
            ],
            'roomType' => [
                'id' => $roomType->id,
                'name' => $roomType->name,
                'bed_type' => $roomType->bed_type,
                'max_guest' => $roomType->max_guest,
            ],
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
            'voucher' => $voucherPayload,
        ]);
    }

    public function applyVoucher(Request $request): RedirectResponse
    {
        $draft = $request->session()->get('booking_draft');
        if (! $draft) {
            return redirect()->route('home')->withErrors(['voucher' => 'Data booking tidak ditemukan.']);
        }

        $data = $request->validate([
            'voucher_code' => ['required', 'string', 'max:50'],
        ]);

        $code = strtoupper(trim($data['voucher_code']));
        $voucher = $this->resolveVoucher($code, (int) $draft['hotel_id']);
        if (! $voucher) {
            return back()->withErrors(['voucher_code' => 'Voucher tidak valid atau sudah habis.']);
        }

        $roomType = RoomType::query()->findOrFail($draft['room_type_id']);
        $hotel = Hotel::query()->with('taxes')->findOrFail($draft['hotel_id']);
        try {
            $pricing = app(BookingService::class)
                ->calculatePricing(
                    $roomType,
                    $draft['check_in'],
                    $draft['check_out'],
                    $draft['rooms'],
                    $draft['guests'],
                    $draft['children'] ?? 0,
                    $draft['children_ages'] ?? []
                );
        } catch (RuntimeException $exception) {
            return back()->withErrors(['voucher_code' => 'Voucher tidak bisa digunakan untuk tanggal ini.']);
        }

        if ($voucher->min_transaction > 0 && $pricing['subtotal'] < $voucher->min_transaction) {
            return back()->withErrors(['voucher_code' => 'Minimum transaksi belum memenuhi syarat voucher.']);
        }

        if (! $this->canUseVoucherForUser($voucher, (int) $request->user()->id)) {
            return back()->withErrors(['voucher_code' => 'Voucher sudah mencapai limit penggunaan untuk akun ini.']);
        }

        $draft['voucher_code'] = $voucher->code;
        $request->session()->put('booking_draft', $draft);

        return back()->with('status', 'voucher-applied');
    }

    public function removeVoucher(Request $request): RedirectResponse
    {
        $draft = $request->session()->get('booking_draft');
        if (! $draft) {
            return redirect()->route('home');
        }

        $this->clearVoucherDraft($request);

        return back()->with('status', 'voucher-removed');
    }

    public function confirm(Request $request, BookingService $bookingService): RedirectResponse
    {
        $draft = $request->session()->get('booking_draft');
        if (! $draft) {
            return redirect()->route('home')->withErrors(['booking' => 'Data booking tidak ditemukan.']);
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

        $roomType = RoomType::query()->findOrFail($draft['room_type_id']);

        try {
            $booking = DB::transaction(function () use ($request, $draft, $roomType, $hotel, $data, $bookingService) {
                $pricing = $bookingService->calculatePricing(
                    $roomType,
                    $draft['check_in'],
                    $draft['check_out'],
                    $draft['rooms'],
                    $draft['guests'],
                    $draft['children'] ?? 0,
                    $draft['children_ages'] ?? []
                );
                $voucher = null;
                $discountAmount = 0;

                if (! empty($draft['voucher_code'])) {
                    $voucher = Voucher::query()
                        ->where('code', strtoupper($draft['voucher_code']))
                        ->lockForUpdate()
                        ->first();

                    if (! $voucher || ! $this->isVoucherValid($voucher, (int) $draft['hotel_id'])) {
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

                $bookingService->reserveInventory($roomType, $draft['check_in'], $draft['check_out'], $draft['rooms'], false);

                $taxableSubtotal = max(0, $pricing['subtotal'] - $discountAmount);
                [$taxItems, $taxTotal] = $this->buildTaxBreakdown($hotel, $taxableSubtotal);
                $serviceFee = $this->resolveServiceFee();
                $total = max(0, $taxableSubtotal + $taxTotal + $serviceFee);

                $booking = Booking::create([
                    'user_id' => $request->user()->id,
                    'hotel_id' => $draft['hotel_id'],
                    'voucher_id' => $voucher?->id,
                    'voucher_code' => $voucher?->code,
                    'check_in' => $draft['check_in'],
                    'check_out' => $draft['check_out'],
                    'nights' => $pricing['nights'],
                    'rooms_count' => $draft['rooms'],
                    'guests_count' => $draft['guests'],
                    'children_count' => $draft['children'] ?? 0,
                    'children_ages' => $draft['children_ages'] ?? [],
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
                    'rooms_count' => $draft['rooms'],
                    'price_per_night' => (int) round($roomType->base_price),
                    'subtotal' => $pricing['base_subtotal'] ?? $pricing['subtotal'],
                ]);

                return $booking;
            });
        } catch (RuntimeException $exception) {
            return back()->withErrors(['rooms' => $exception->getMessage()]);
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

        $request->session()->forget('booking_draft');

        return redirect()->route('booking.payment', ['booking' => $this->encryptId($booking->id)]);
    }

    public function payment(Request $request, string $booking): Response|RedirectResponse
    {
        $booking = $this->resolveBooking($booking);

        if ((int) $booking->user_id !== (int) $request->user()->id) {
            return redirect()->route('home');
        }

        if ($booking->isExpired()) {
            $this->expireBooking($booking);
        }

        $booking->load('hotel', 'rooms.roomType', 'payments');

        return Inertia::render('public/booking/payment', [
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
            $this->expireBooking($booking);
            return redirect()->route('booking.payment', ['booking' => $this->encryptId($booking->id)])
                ->withErrors(['payment' => 'Booking sudah kedaluwarsa.']);
        }

        if ($booking->status !== 'pending_payment') {
            return redirect()->route('booking.payment', ['booking' => $this->encryptId($booking->id)]);
        }

        if ($booking->payments()->where('status', 'pending')->exists()) {
            return redirect()->route('booking.payment', ['booking' => $this->encryptId($booking->id)]);
        }

        $orderId = sprintf('INDOTIX-%s-%s', $booking->id, now()->format('YmdHis'));

        $payload = $this->buildSnapPayload($booking, $orderId);

        try {
            $charge = $midtransService->snap($payload);
        } catch (\Throwable $exception) {
            return redirect()->route('booking.payment', ['booking' => $this->encryptId($booking->id)])
                ->withErrors(['payment' => 'Gagal menghubungi server pembayaran. Silakan coba lagi.']);
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
            ],
        ]);

        return redirect()->route('booking.payment', ['booking' => $this->encryptId($booking->id)]);
    }

    public function show(Request $request, string $booking): Response|RedirectResponse
    {
        $booking = $this->resolveBooking($booking);

        if ((int) $booking->user_id !== (int) $request->user()->id) {
            return redirect()->route('home');
        }

        if ($booking->isExpired()) {
            $this->expireBooking($booking);
        }

        $booking->load('hotel', 'rooms.roomType', 'payments');

        $reviewUrl = $booking->hotel_id
            ? '/stay/hotels/'.$booking->hotel?->slug
            : null;

        return Inertia::render('public/booking/show', [
            'booking' => array_merge($this->bookingPayload($booking), [
                'review' => [
                    'can_review' => ProductReviewService::hasUsedBooking($request->user()->id, 'hotel', (int) $booking->hotel_id),
                    'url' => $reviewUrl,
                ],
            ]),
        ]);
    }

    public function cancel(Request $request, string $booking): RedirectResponse
    {
        $booking = $this->resolveBooking($booking);

        if ((int) $booking->user_id !== (int) $request->user()->id) {
            return redirect()->route('home');
        }

        if ($booking->status !== 'pending_payment') {
            return redirect()->route('booking.show', ['booking' => $this->encryptId($booking->id)])
                ->withErrors(['cancel' => 'Pesanan tidak dapat dibatalkan.']);
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
            ],
        ]);

        return redirect()->route('booking.show', ['booking' => $this->encryptId($booking->id)]);
    }

    public function invoice(Request $request, string $booking)
    {
        $booking = $this->resolveBooking($booking);

        if ((int) $booking->user_id !== (int) $request->user()->id) {
            return redirect()->route('home');
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

    private function buildSnapPayload(Booking $booking, string $orderId): array
    {
        $transactionDetails = [
            'order_id' => $orderId,
            'gross_amount' => (int) $booking->total,
        ];

        $customer = [
            'first_name' => $booking->guest_name,
            'email' => $booking->guest_email,
            'phone' => $booking->guest_phone,
        ];

        return [
            'transaction_details' => $transactionDetails,
            'customer_details' => $customer,
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

    private function resolveBooking(string $encryptedId): Booking
    {
        try {
            $id = Crypt::decryptString($encryptedId);
        } catch (\Throwable $exception) {
            abort(404);
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

    private function clearVoucherDraft(Request $request): void
    {
        $draft = $request->session()->get('booking_draft');
        if (! $draft) {
            return;
        }

        unset($draft['voucher_code']);
        $request->session()->put('booking_draft', $draft);
    }
}
