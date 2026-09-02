<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademyBooking;
use App\Models\Booking;
use App\Models\BookingRoom;
use App\Models\EventBooking;
use App\Models\SpecialProgramBooking;
use App\Models\SouvenirOrder;
use App\Models\WisataBooking;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Validation\Rule;

class HistoryDetailController extends Controller
{
    public function show(Request $request, string $type, string $booking): JsonResponse
    {
        $data = validator(['type' => $type], [
            'type' => ['required', Rule::in(['hotel', 'wisata', 'event', 'special_program', 'souvenir', 'academy'])],
        ])->validate();

        $type = $data['type'];
        $userId = (int) $request->user()->id;

        switch ($type) {
            case 'hotel':
                return $this->hotelDetail($userId, $booking);
            case 'wisata':
                return $this->wisataDetail($userId, $booking);
            case 'event':
                return $this->eventDetail($userId, $booking);
            case 'academy':
                return $this->academyDetail($userId, $booking);
            case 'special_program':
                return $this->specialProgramDetail($userId, $booking);
            case 'souvenir':
                return $this->souvenirDetail($userId, $booking);
            default:
                return response()->json(['message' => 'Tipe tidak valid.'], 422);
        }
    }

    private function hotelDetail(int $userId, string $booking): JsonResponse
    {
        $bookingId = $this->resolveId($booking);
        $booking = Booking::query()
            ->with(['hotel', 'rooms.roomType', 'payments'])
            ->findOrFail($bookingId);

        if ((int) $booking->user_id !== $userId) {
            return response()->json(['message' => 'Data tidak ditemukan.'], 404);
        }

        $latestPayment = $booking->payments()->latest()->first();

        return response()->json([
            'type' => 'hotel',
            'booking' => [
                'encrypted_id' => Crypt::encryptString((string) $booking->id),
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
                'qr_data' => $this->buildQrData('HOTEL', Crypt::encryptString((string) $booking->id)),
                'qr_url' => $this->buildQrUrl('HOTEL', Crypt::encryptString((string) $booking->id)),
            ],
        ]);
    }

    private function wisataDetail(int $userId, string $booking): JsonResponse
    {
        $bookingId = $this->resolveId($booking);
        $booking = WisataBooking::query()
            ->with(['ticket', 'items.ticket', 'destination', 'payments'])
            ->findOrFail($bookingId);

        if ((int) $booking->user_id !== $userId) {
            return response()->json(['message' => 'Data tidak ditemukan.'], 404);
        }

        $latestPayment = $booking->payments()->latest()->first();

        return response()->json([
            'type' => 'wisata',
            'booking' => [
                'id' => $booking->id,
                'encrypted_id' => Crypt::encryptString((string) $booking->id),
                'booking_code' => $booking->booking_code,
                'visit_date' => $booking->visit_date?->toDateString(),
                'quantity' => $booking->quantity,
                'unit_price' => $booking->unit_price,
                'total' => $booking->total_price,
                'status' => $booking->status,
                'payment_status' => $booking->payment_status,
                'payment_deadline' => $booking->payment_deadline?->toIso8601String(),
                'ticket' => [
                    'id' => $booking->ticket?->id,
                    'name' => $booking->ticket?->name,
                ],
                'items' => $booking->items->isNotEmpty()
                    ? $booking->items
                        ->map(fn ($item) => [
                            'ticket_id' => $item->wisata_ticket_id,
                            'name' => $item->ticket_name ?: ($item->ticket?->name ?? 'Tiket Wisata'),
                            'quantity' => (int) $item->quantity,
                            'used_quantity' => (int) $item->used_quantity,
                            'remaining_quantity' => $item->remainingQuantity(),
                            'unit_price' => (int) $item->unit_price,
                            'subtotal' => (int) $item->subtotal,
                        ])
                        ->values()
                        ->all()
                    : [[
                        'ticket_id' => $booking->wisata_ticket_id,
                        'name' => $booking->ticket?->name ?? 'Tiket Wisata',
                        'quantity' => (int) $booking->quantity,
                        'used_quantity' => 0,
                        'remaining_quantity' => (int) $booking->quantity,
                        'unit_price' => (int) $booking->unit_price,
                        'subtotal' => (int) $booking->total_price,
                    ]],
                'destination' => [
                    'id' => $booking->destination?->id,
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
            ],
        ]);
    }

    private function eventDetail(int $userId, string $booking): JsonResponse
    {
        $bookingId = $this->resolveId($booking);
        $booking = EventBooking::query()
            ->with(['event', 'ticket', 'payments'])
            ->findOrFail($bookingId);

        if ((int) $booking->user_id !== $userId) {
            return response()->json(['message' => 'Data tidak ditemukan.'], 404);
        }

        $payment = $booking->payments()->latest()->first();

        return response()->json([
            'type' => 'event',
            'booking' => [
                'id' => $booking->id,
                'encrypted_id' => Crypt::encryptString((string) $booking->id),
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
                'qr_data' => $this->buildQrData('EVENT', (string) $booking->booking_code),
                'qr_url' => $this->buildQrUrl('EVENT', (string) $booking->booking_code),
                'payment' => $payment ? [
                    'status' => $payment->status,
                    'payment_type' => $payment->payment_type,
                    'payload' => $payment->payload,
                ] : null,
            ],
        ]);
    }

    private function academyDetail(int $userId, string $booking): JsonResponse
    {
        $bookingId = $this->resolveId($booking);
        $booking = AcademyBooking::query()
            ->with(['academyClass', 'ticket', 'payments'])
            ->findOrFail($bookingId);

        if ((int) $booking->user_id !== $userId) {
            return response()->json(['message' => 'Data tidak ditemukan.'], 404);
        }

        $payment = $booking->payments()->latest()->first();
        $class = $booking->academyClass;

        return response()->json([
            'type' => 'academy',
            'booking' => [
                'id' => $booking->id,
                'encrypted_id' => Crypt::encryptString((string) $booking->id),
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
                'qr_data' => $this->buildQrData('ACADEMY', (string) $booking->booking_code),
                'qr_url' => $this->buildQrUrl('ACADEMY', (string) $booking->booking_code),
                'payment' => $payment ? [
                    'status' => $payment->status,
                    'payment_type' => $payment->payment_type,
                    'payload' => $payment->payload,
                ] : null,
            ],
        ]);
    }

    private function specialProgramDetail(int $userId, string $booking): JsonResponse
    {
        $bookingId = $this->resolveId($booking);
        $booking = SpecialProgramBooking::query()
            ->with(['program', 'variant', 'payments'])
            ->findOrFail($bookingId);

        if ((int) $booking->user_id !== $userId) {
            return response()->json(['message' => 'Data tidak ditemukan.'], 404);
        }

        $payment = $booking->payments()->latest()->first();

        return response()->json([
            'type' => 'special_program',
            'booking' => [
                'id' => $booking->id,
                'encrypted_id' => Crypt::encryptString((string) $booking->id),
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
                'qr_data' => $this->buildQrData('SPECIAL_PROGRAM', (string) ($booking->midtrans_order_id ?? $booking->id)),
                'qr_url' => $this->buildQrUrl('SPECIAL_PROGRAM', (string) ($booking->midtrans_order_id ?? $booking->id)),
                'payment' => $payment ? [
                    'status' => $payment->status,
                    'payment_type' => $payment->payment_type,
                    'payload' => $payment->payload,
                ] : null,
            ],
        ]);
    }

    private function souvenirDetail(int $userId, string $order): JsonResponse
    {
        $orderId = $this->resolveId($order);
        $order = SouvenirOrder::query()
            ->with(['items', 'user'])
            ->findOrFail($orderId);

        if ((int) $order->user_id !== $userId) {
            return response()->json(['message' => 'Data tidak ditemukan.'], 404);
        }

        return response()->json([
            'type' => 'souvenir',
            'order' => [
                'id' => $order->id,
                'encrypted_id' => Crypt::encryptString((string) $order->id),
                'status' => $order->status,
                'payment_status' => $order->payment_status,
                'payment_deadline' => $order->payment_deadline?->toIso8601String(),
                'total_price' => $order->total_price,
                'shipping_address' => $order->shipping_address,
                'shipping_status' => $order->shipping_status,
                'tracking_number' => $order->tracking_number,
                'items' => $order->items->map(fn ($item) => [
                    'name' => $item->product_id ? $item->product_name : 'Produk tidak tersedia',
                    'sku' => $item->sku,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'subtotal' => $item->subtotal,
                ]),
            ],
        ]);
    }

    private function resolveId(string $value): int
    {
        if (ctype_digit($value)) {
            return (int) $value;
        }

        try {
            return (int) Crypt::decryptString($value);
        } catch (\Throwable $exception) {
            abort(404);
        }
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
