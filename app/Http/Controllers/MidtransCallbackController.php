<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Payment;
use App\Models\UserNotification;
use App\Models\EventBooking;
use App\Models\EventPayment;
use App\Models\SpecialProgramBooking;
use App\Models\SpecialProgramPayment;
use App\Models\WisataBooking;
use App\Models\WisataPayment;
use App\Models\SouvenirOrder;
use App\Services\BookingService;
use App\Services\MidtransService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class MidtransCallbackController extends Controller
{
    public function __invoke(Request $request, MidtransService $midtransService): Response
    {
        $payload = $request->all();

        $orderId = (string) ($payload['order_id'] ?? '');
        $statusCode = (string) ($payload['status_code'] ?? '');
        $grossAmount = (string) ($payload['gross_amount'] ?? '');
        $signature = (string) ($payload['signature_key'] ?? '');

        if (! $orderId || ! $midtransService->validateSignature($orderId, $statusCode, $grossAmount, $signature)) {
            return response('Invalid signature', 400);
        }

        $payment = Payment::query()->where('order_id', $orderId)->latest()->first();
        $booking = $payment?->booking ?? Booking::query()->where('midtrans_order_id', $orderId)->first();

        $wisataPayment = null;
        $wisataBooking = null;
        $eventPayment = null;
        $eventBooking = null;
        $specialPayment = null;
        $specialBooking = null;
        $souvenirOrder = null;
        if (! $booking) {
            $wisataPayment = WisataPayment::query()->where('order_id', $orderId)->latest()->first();
            $wisataBooking = $wisataPayment?->booking ?? WisataBooking::query()->where('midtrans_order_id', $orderId)->first();
        }
        if (! $booking && ! $wisataBooking) {
            $eventPayment = EventPayment::query()->where('order_id', $orderId)->latest()->first();
            $eventBooking = $eventPayment?->booking ?? EventBooking::query()->where('midtrans_order_id', $orderId)->first();
        }
        if (! $booking && ! $wisataBooking && ! $eventBooking) {
            $specialPayment = SpecialProgramPayment::query()->where('order_id', $orderId)->latest()->first();
            $specialBooking = $specialPayment?->booking ?? SpecialProgramBooking::query()->where('midtrans_order_id', $orderId)->first();
        }
        if (! $booking && ! $wisataBooking && ! $eventBooking && ! $specialBooking) {
            $souvenirOrder = SouvenirOrder::query()->where('midtrans_order_id', $orderId)->first();
        }

        if (! $booking && ! $wisataBooking && ! $eventBooking && ! $specialBooking && ! $souvenirOrder) {
            return response('Booking not found', 404);
        }

        $status = $payload['transaction_status'] ?? null;

        if ($payment) {
            $payment->update([
                'status' => $status ?? $payment->status,
                'payment_type' => $payload['payment_type'] ?? $payment->payment_type,
                'transaction_id' => $payload['transaction_id'] ?? $payment->transaction_id,
                'payload' => $payload,
            ]);
        }

        if ($wisataPayment) {
            $wisataPayment->update([
                'status' => $status ?? $wisataPayment->status,
                'payment_type' => $payload['payment_type'] ?? $wisataPayment->payment_type,
                'transaction_id' => $payload['transaction_id'] ?? $wisataPayment->transaction_id,
                'payload' => $payload,
            ]);
        }
        if ($eventPayment) {
            $eventPayment->update([
                'status' => $status ?? $eventPayment->status,
                'payment_type' => $payload['payment_type'] ?? $eventPayment->payment_type,
                'transaction_id' => $payload['transaction_id'] ?? $eventPayment->transaction_id,
                'payload' => $payload,
            ]);
        }
        if ($specialPayment) {
            $specialPayment->update([
                'status' => $status ?? $specialPayment->status,
                'payment_type' => $payload['payment_type'] ?? $specialPayment->payment_type,
                'transaction_id' => $payload['transaction_id'] ?? $specialPayment->transaction_id,
                'payload' => $payload,
            ]);
        }

        if ($souvenirOrder) {
            $souvenirOrder->update([
                'payment_status' => $status ?? $souvenirOrder->payment_status,
                'payment_type' => $payload['payment_type'] ?? $souvenirOrder->payment_type,
                'transaction_id' => $payload['transaction_id'] ?? $souvenirOrder->transaction_id,
                'payment_payload' => $payload,
            ]);
        }

        if ($booking && in_array($status, ['settlement', 'capture', 'success'], true)) {
            $booking->update([
                'status' => 'paid',
                'payment_status' => $status,
            ]);

            UserNotification::create([
                'user_id' => $booking->user_id,
                'title' => 'Pembayaran berhasil',
                'message' => 'Pembayaran kamu sudah diterima. Booking sudah aktif.',
                'type' => 'payment_paid',
                'data' => [
                    'booking_id' => \Illuminate\Support\Facades\Crypt::encryptString((string) $booking->id),
                    'category' => 'hotel',
                ],
            ]);
        }

        if ($wisataBooking && in_array($status, ['settlement', 'capture', 'success'], true)) {
            $wisataBooking->update([
                'status' => 'paid',
                'payment_status' => $status,
            ]);

            UserNotification::create([
                'user_id' => $wisataBooking->user_id,
                'title' => 'Pembayaran tiket berhasil',
                'message' => 'Pembayaran kamu sudah diterima. Tiket wisata aktif.',
                'type' => 'wisata_payment_paid',
                'data' => [
                    'booking_id' => \Illuminate\Support\Facades\Crypt::encryptString((string) $wisataBooking->id),
                    'type' => 'wisata',
                    'category' => 'wisata',
                ],
            ]);
        }

        if ($eventBooking && in_array($status, ['settlement', 'capture', 'success'], true)) {
            $wasPaid = $eventBooking->status === 'paid';
            $eventBooking->update([
                'status' => 'paid',
                'payment_status' => $status,
            ]);
            if (! $wasPaid) {
                $eventBooking->ticket?->increment('sold_count', $eventBooking->quantity);
                $eventBooking->event?->increment('capacity_sold', $eventBooking->quantity);
            }

            UserNotification::create([
                'user_id' => $eventBooking->user_id,
                'title' => 'Pembayaran event berhasil',
                'message' => 'Pembayaran kamu sudah diterima. Tiket event aktif.',
                'type' => 'event_payment_paid',
                'data' => [
                    'booking_id' => \Illuminate\Support\Facades\Crypt::encryptString((string) $eventBooking->id),
                    'type' => 'event',
                    'category' => 'event',
                ],
            ]);
        }

        if ($specialBooking && in_array($status, ['settlement', 'capture', 'success'], true)) {
            $specialBooking->update([
                'status' => 'paid',
                'payment_status' => $status,
            ]);

            UserNotification::create([
                'user_id' => $specialBooking->user_id,
                'title' => 'Pembayaran special program berhasil',
                'message' => 'Pembayaran kamu sudah diterima. Pesanan special program aktif.',
                'type' => 'special_program_payment_paid',
                'data' => [
                    'booking_id' => \Illuminate\Support\Facades\Crypt::encryptString((string) $specialBooking->id),
                    'category' => 'special_program',
                ],
            ]);
        }

        if ($souvenirOrder && in_array($status, ['settlement', 'capture', 'success'], true)) {
            $souvenirOrder->update([
                'status' => 'paid',
                'payment_status' => $status,
            ]);

            UserNotification::create([
                'user_id' => $souvenirOrder->user_id,
                'title' => 'Pembayaran souvenir berhasil',
                'message' => 'Pembayaran kamu sudah diterima. Pesanan souvenir diproses.',
                'type' => 'souvenir_payment_paid',
                'data' => [
                    'booking_id' => \Illuminate\Support\Facades\Crypt::encryptString((string) $souvenirOrder->id),
                    'category' => 'souvenir',
                ],
            ]);
        }

        if ($booking && in_array($status, ['cancel', 'expire', 'deny'], true)) {
            if ($booking->status === 'pending_payment') {
                $room = $booking->rooms()->first();
                if ($room && $room->roomType) {
                    app(BookingService::class)->releaseInventory(
                        $room->roomType,
                        $booking->check_in->toDateString(),
                        $booking->check_out->toDateString(),
                        $room->rooms_count
                    );
                }
            }

            $booking->update([
                'status' => 'expired',
                'payment_status' => $status,
            ]);

            UserNotification::create([
                'user_id' => $booking->user_id,
                'title' => 'Pembayaran gagal',
                'message' => 'Pembayaran tidak berhasil atau kedaluwarsa. Silakan buat pesanan baru.',
                'type' => 'booking_expired',
                'data' => [
                    'booking_id' => \Illuminate\Support\Facades\Crypt::encryptString((string) $booking->id),
                    'category' => 'hotel',
                ],
            ]);
        }

        if ($wisataBooking && in_array($status, ['cancel', 'expire', 'deny'], true)) {
            if ($wisataBooking->status === 'pending_payment') {
                $wisataBooking->update([
                    'status' => 'expired',
                    'payment_status' => $status,
                ]);
            }

            UserNotification::create([
                'user_id' => $wisataBooking->user_id,
                'title' => 'Pembayaran tiket gagal',
                'message' => 'Pembayaran tiket wisata tidak berhasil atau kedaluwarsa.',
                'type' => 'wisata_booking_expired',
                'data' => [
                    'booking_id' => \Illuminate\Support\Facades\Crypt::encryptString((string) $wisataBooking->id),
                    'type' => 'wisata',
                    'category' => 'wisata',
                ],
            ]);
        }

        if ($eventBooking && in_array($status, ['cancel', 'expire', 'deny'], true)) {
            if ($eventBooking->status === 'pending_payment') {
                $eventBooking->update([
                    'status' => 'expired',
                    'payment_status' => $status,
                ]);
            }

            UserNotification::create([
                'user_id' => $eventBooking->user_id,
                'title' => 'Pembayaran event gagal',
                'message' => 'Pembayaran event tidak berhasil atau kedaluwarsa.',
                'type' => 'event_booking_expired',
                'data' => [
                    'booking_id' => \Illuminate\Support\Facades\Crypt::encryptString((string) $eventBooking->id),
                    'type' => 'event',
                    'category' => 'event',
                ],
            ]);
        }

        if ($specialBooking && in_array($status, ['cancel', 'expire', 'deny'], true)) {
            if ($specialBooking->status === 'pending_payment') {
                $specialBooking->update([
                    'status' => 'expired',
                    'payment_status' => $status,
                ]);
            }

            UserNotification::create([
                'user_id' => $specialBooking->user_id,
                'title' => 'Pembayaran special program gagal',
                'message' => 'Pembayaran special program tidak berhasil atau kedaluwarsa.',
                'type' => 'special_program_booking_expired',
                'data' => [
                    'booking_id' => \Illuminate\Support\Facades\Crypt::encryptString((string) $specialBooking->id),
                    'category' => 'special_program',
                ],
            ]);
        }

        if ($souvenirOrder && in_array($status, ['cancel', 'expire', 'deny'], true)) {
            if ($souvenirOrder->status === 'pending_payment') {
                $souvenirOrder->update([
                    'status' => 'expired',
                    'payment_status' => $status,
                ]);
            }

            UserNotification::create([
                'user_id' => $souvenirOrder->user_id,
                'title' => 'Pembayaran souvenir gagal',
                'message' => 'Pembayaran souvenir tidak berhasil atau kedaluwarsa.',
                'type' => 'souvenir_booking_expired',
                'data' => [
                    'booking_id' => \Illuminate\Support\Facades\Crypt::encryptString((string) $souvenirOrder->id),
                    'category' => 'souvenir',
                ],
            ]);
        }

        return response('OK', 200);
    }
}
