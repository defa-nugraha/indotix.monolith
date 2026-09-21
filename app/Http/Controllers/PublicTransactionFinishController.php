<?php

namespace App\Http\Controllers;

use App\Models\WisataPayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Inertia\Inertia;
use Inertia\Response;

class PublicTransactionFinishController extends Controller
{
    public function show(Request $request): Response
    {
        $data = $request->validate([
            'order_id' => ['required', 'string', 'max:120'],
        ]);

        $payment = WisataPayment::query()
            ->where('order_id', $data['order_id'])
            ->with('booking.destination')
            ->firstOrFail();
        $booking = $payment->booking;

        abort_unless($booking && (int) $booking->user_id === (int) $request->user()->id, 404);

        $isPaid = in_array($booking->status, ['paid', 'completed'], true)
            && in_array($payment->status, ['settlement', 'capture', 'paid'], true);

        return Inertia::render('public/transaction/finish', [
            'transaction' => [
                'is_paid' => $isPaid,
                'order_id' => $payment->order_id,
                'booking_code' => $booking->booking_code,
                'destination_name' => $booking->destination?->destination_name,
                'booking_url' => route('wisata.booking.show', [
                    'booking' => Crypt::encryptString((string) $booking->id),
                ]),
            ],
        ]);
    }
}
