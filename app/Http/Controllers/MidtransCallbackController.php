<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Payment;
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

        if (! $booking) {
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

        if (in_array($status, ['settlement', 'capture', 'success'], true)) {
            $booking->update([
                'status' => 'paid',
                'payment_status' => $status,
            ]);
        }

        if (in_array($status, ['cancel', 'expire', 'deny'], true)) {
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
        }

        return response('OK', 200);
    }
}
