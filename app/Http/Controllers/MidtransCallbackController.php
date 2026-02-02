<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Payment;
use App\Models\UserNotification;
use App\Models\WisataBooking;
use App\Models\WisataPayment;
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
        if (! $booking) {
            $wisataPayment = WisataPayment::query()->where('order_id', $orderId)->latest()->first();
            $wisataBooking = $wisataPayment?->booking ?? WisataBooking::query()->where('midtrans_order_id', $orderId)->first();
        }

        if (! $booking && ! $wisataBooking) {
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
                ],
            ]);
        }

        return response('OK', 200);
    }
}
