<?php

namespace App\Http\Controllers;

use App\Models\WisataBooking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PublicWisataHistoryController extends Controller
{
    public function index(Request $request): Response
    {
        $bookings = WisataBooking::query()
            ->where('user_id', $request->user()->id)
            ->with(['destination', 'ticket'])
            ->latest()
            ->get()
            ->map(function (WisataBooking $booking) {
                $destination = $booking->destination;

                return [
                    'id' => $booking->id,
                    'encrypted_id' => Crypt::encryptString((string) $booking->id),
                    'booking_code' => $booking->booking_code,
                    'destination_name' => $destination?->destination_name,
                    'city_name' => $this->resolveCityName($destination?->city_code),
                    'address' => $destination?->address_full,
                    'visit_date' => $booking->visit_date?->toDateString(),
                    'quantity' => $booking->quantity,
                    'total' => $booking->total_price,
                    'status' => $booking->status,
                    'payment_status' => $booking->payment_status,
                    'payment_deadline' => $booking->payment_deadline?->toIso8601String(),
                    'guest_name' => $booking->guest_name,
                    'guest_email' => $booking->guest_email,
                    'guest_phone' => $booking->guest_phone,
                    'created_at' => $booking->created_at?->toIso8601String(),
                    'midtrans_order_id' => $booking->midtrans_order_id,
                    'ticket_name' => $booking->ticket?->name,
                ];
            });

        return Inertia::render('public/wisata/history', [
            'bookings' => $bookings,
        ]);
    }

    private function resolveCityName(?string $cityCode): ?string
    {
        if (! $cityCode) {
            return null;
        }

        return DB::table('regencies')->where('code', $cityCode)->value('name');
    }
}
