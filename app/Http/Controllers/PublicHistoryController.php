<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Inertia\Inertia;
use Inertia\Response;

class PublicHistoryController extends Controller
{
    public function index(Request $request): Response
    {
        $bookings = Booking::query()
            ->where('user_id', $request->user()->id)
            ->with(['hotel.city'])
            ->latest()
            ->get()
            ->map(fn (Booking $booking) => [
                'id' => $booking->id,
                'encrypted_id' => Crypt::encryptString((string) $booking->id),
                'hotel_name' => $booking->hotel?->name,
                'city_name' => $booking->hotel?->city?->name,
                'address' => $booking->hotel?->address,
                'check_in' => $booking->check_in?->toDateString(),
                'check_out' => $booking->check_out?->toDateString(),
                'nights' => $booking->nights,
                'rooms_count' => $booking->rooms_count,
                'guests_count' => $booking->guests_count,
                'total' => $booking->total,
                'status' => $booking->status,
                'payment_status' => $booking->payment_status,
                'payment_deadline' => $booking->payment_deadline?->toIso8601String(),
                'guest_name' => $booking->guest_name,
                'guest_email' => $booking->guest_email,
                'guest_phone' => $booking->guest_phone,
                'created_at' => $booking->created_at?->toIso8601String(),
                'midtrans_order_id' => $booking->midtrans_order_id,
            ]);

        return Inertia::render('public/history', [
            'bookings' => $bookings,
        ]);
    }
}
