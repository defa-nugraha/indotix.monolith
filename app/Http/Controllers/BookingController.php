<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\BookingRoom;
use App\Models\Hotel;
use App\Models\Payment;
use App\Models\RoomType;
use App\Services\BookingService;
use App\Services\MidtransService;
use App\Models\UserNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

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
        ]);

        $roomType = RoomType::query()->where('id', $data['room_type_id'])->firstOrFail();
        if ((int) $roomType->hotel_id !== (int) $data['hotel_id']) {
            return back()->withErrors(['room_type_id' => 'Tipe kamar tidak sesuai hotel.']);
        }

        try {
            $pricing = $bookingService->calculatePricing($roomType, $data['check_in'], $data['check_out'], $data['rooms']);
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

        $hotel = Hotel::query()->with('city')->findOrFail($draft['hotel_id']);
        $roomType = RoomType::query()->findOrFail($draft['room_type_id']);
        if ((int) $roomType->hotel_id !== (int) $draft['hotel_id']) {
            return back()->withErrors(['rooms' => 'Tipe kamar tidak sesuai hotel.']);
        }

        try {
            $pricing = $bookingService->calculatePricing($roomType, $draft['check_in'], $draft['check_out'], $draft['rooms']);
        } catch (RuntimeException $exception) {
            $request->session()->forget('booking_draft');

            return redirect()->route('public.hotels.show', $hotel)
                ->withErrors(['rooms' => $exception->getMessage()]);
        }

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
            'pricing' => $pricing,
        ]);
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
            'guest_phone' => ['required', 'string', 'max:30'],
            'special_request' => ['nullable', 'string', 'max:1000'],
        ]);

        $roomType = RoomType::query()->findOrFail($draft['room_type_id']);

        try {
            $booking = DB::transaction(function () use ($request, $draft, $roomType, $data, $bookingService) {
                $pricing = $bookingService->calculatePricing($roomType, $draft['check_in'], $draft['check_out'], $draft['rooms']);

                $bookingService->reserveInventory($roomType, $draft['check_in'], $draft['check_out'], $draft['rooms'], false);

                $booking = Booking::create([
                    'user_id' => $request->user()->id,
                    'hotel_id' => $draft['hotel_id'],
                    'check_in' => $draft['check_in'],
                    'check_out' => $draft['check_out'],
                    'nights' => $pricing['nights'],
                    'rooms_count' => $draft['rooms'],
                    'guests_count' => $draft['guests'],
                    'subtotal' => $pricing['subtotal'],
                    'total' => $pricing['subtotal'],
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
                    'subtotal' => $pricing['subtotal'],
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
            'paymentOptions' => [
                ['id' => 'bca_va', 'label' => 'BCA Virtual Account'],
                ['id' => 'bni_va', 'label' => 'BNI Virtual Account'],
                ['id' => 'bri_va', 'label' => 'BRI Virtual Account'],
                ['id' => 'mandiri_va', 'label' => 'Mandiri Virtual Account'],
                ['id' => 'gopay', 'label' => 'GoPay'],
                ['id' => 'qris', 'label' => 'QRIS'],
            ],
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

        $data = $request->validate([
            'payment_type' => ['required', 'string'],
        ]);

        if ($booking->status !== 'pending_payment') {
            return redirect()->route('booking.payment', ['booking' => $this->encryptId($booking->id)]);
        }

        if ($booking->payments()->where('status', 'pending')->exists()) {
            return redirect()->route('booking.payment', ['booking' => $this->encryptId($booking->id)])
                ->withErrors(['payment' => 'Pembayaran sedang diproses.']);
        }

        $orderId = sprintf('INDOTIX-%s-%s', $booking->id, now()->format('YmdHis'));

        $payload = $this->buildChargePayload($booking, $data['payment_type'], $orderId);

        try {
            $charge = $midtransService->charge($payload);
        } catch (\Throwable $exception) {
            return redirect()->route('booking.payment', ['booking' => $this->encryptId($booking->id)])
                ->withErrors(['payment' => 'Gagal menghubungi server pembayaran. Silakan coba lagi.']);
        }

        $payment = Payment::create([
            'booking_id' => $booking->id,
            'provider' => 'midtrans',
            'status' => $charge['transaction_status'] ?? 'pending',
            'gross_amount' => (int) $booking->total,
            'payment_type' => $charge['payment_type'] ?? $data['payment_type'],
            'transaction_id' => $charge['transaction_id'] ?? null,
            'order_id' => $charge['order_id'] ?? $orderId,
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

        return Inertia::render('public/booking/show', [
            'booking' => $this->bookingPayload($booking),
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

        return \PDF::loadView('invoice', [
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
            'total' => $booking->total,
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
        ];
    }

    private function buildChargePayload(Booking $booking, string $paymentType, string $orderId): array
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

        $payload = [
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

        if (str_ends_with($paymentType, '_va')) {
            $bank = str_replace('_va', '', $paymentType);
            $payload['payment_type'] = 'bank_transfer';
            $payload['bank_transfer'] = [
                'bank' => $bank,
            ];
        } else {
            $payload['payment_type'] = $paymentType;
        }

        return $payload;
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
}
