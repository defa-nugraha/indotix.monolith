<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\EventBooking;
use App\Models\SpecialProgramBooking;
use App\Models\WisataBooking;
use App\Models\SouvenirOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PublicHistoryController extends Controller
{
    public function index(Request $request): Response
    {
        $hotelBookings = Booking::query()
            ->where('user_id', $request->user()->id)
            ->with(['hotel.city'])
            ->latest()
            ->get()
            ->map(fn (Booking $booking) => [
                'id' => $booking->id,
                'encrypted_id' => Crypt::encryptString((string) $booking->id),
                'type' => 'hotel',
                'title' => $booking->hotel?->name ?? 'Hotel',
                'city_name' => $booking->hotel?->city?->name,
                'address' => $booking->hotel?->address,
                'check_in' => $booking->check_in?->toDateString(),
                'check_out' => $booking->check_out?->toDateString(),
                'nights' => $booking->nights,
                'rooms_count' => $booking->rooms_count,
                'guests_count' => $booking->guests_count,
                'visit_date' => null,
                'quantity' => null,
                'total' => $booking->total,
                'status' => $booking->status,
                'payment_status' => $booking->payment_status,
                'payment_deadline' => $booking->payment_deadline?->toIso8601String(),
                'guest_name' => $booking->guest_name,
                'guest_email' => $booking->guest_email,
                'guest_phone' => $booking->guest_phone,
                'created_at' => $booking->created_at?->toIso8601String(),
                'midtrans_order_id' => $booking->midtrans_order_id,
                'payment_url' => route('booking.payment', ['booking' => Crypt::encryptString((string) $booking->id)]),
                'detail_url' => route('booking.show', ['booking' => Crypt::encryptString((string) $booking->id)]),
            ]);

        $wisataBookings = WisataBooking::query()
            ->where('user_id', $request->user()->id)
            ->with(['destination', 'ticket'])
            ->latest()
            ->get()
            ->map(function (WisataBooking $booking) {
                $destination = $booking->destination;

                return [
                    'id' => $booking->id,
                    'encrypted_id' => Crypt::encryptString((string) $booking->id),
                    'type' => 'wisata',
                    'title' => $destination?->destination_name ?? 'Wisata',
                    'city_name' => $this->resolveCityName($destination?->city_code),
                    'address' => $destination?->address_full,
                    'check_in' => null,
                    'check_out' => null,
                    'nights' => null,
                    'rooms_count' => null,
                    'guests_count' => null,
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
                    'payment_url' => route('wisata.booking.payment', ['booking' => Crypt::encryptString((string) $booking->id)]),
                    'detail_url' => route('wisata.booking.show', ['booking' => Crypt::encryptString((string) $booking->id)]),
                    'ticket_name' => $booking->ticket?->name,
                ];
            });

        $eventBookings = EventBooking::query()
            ->where('user_id', $request->user()->id)
            ->with(['event', 'ticket'])
            ->latest()
            ->get()
            ->map(function (EventBooking $booking) {
                $event = $booking->event;

                return [
                    'id' => $booking->id,
                    'encrypted_id' => Crypt::encryptString((string) $booking->id),
                    'type' => 'event',
                    'title' => $event?->title ?? 'Event',
                    'city_name' => $this->resolveCityName($event?->city_code),
                    'address' => $event?->address,
                    'check_in' => null,
                    'check_out' => null,
                    'nights' => null,
                    'rooms_count' => null,
                    'guests_count' => null,
                    'visit_date' => $event?->start_at?->toDateString(),
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
                    'payment_url' => route('events.booking.payment', ['booking' => Crypt::encryptString((string) $booking->id)]),
                    'detail_url' => route('events.booking.show', ['booking' => Crypt::encryptString((string) $booking->id)]),
                    'ticket_name' => $booking->ticket?->name,
                ];
            });

        $specialProgramBookings = SpecialProgramBooking::query()
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get()
            ->map(function (SpecialProgramBooking $booking) {
                return [
                    'id' => $booking->id,
                    'encrypted_id' => Crypt::encryptString((string) $booking->id),
                    'type' => 'special_program',
                    'title' => $booking->item_name ?? 'Special Program',
                    'city_name' => $booking->city_name,
                    'address' => null,
                    'check_in' => null,
                    'check_out' => null,
                    'nights' => null,
                    'rooms_count' => null,
                    'guests_count' => null,
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
                    'payment_url' => route('special-programs.booking.payment', ['booking' => Crypt::encryptString((string) $booking->id)]),
                    'detail_url' => route('special-programs.booking.show', ['booking' => Crypt::encryptString((string) $booking->id)]),
                    'ticket_name' => $booking->ticket_name,
                ];
            });

        $souvenirOrders = SouvenirOrder::query()
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get()
            ->map(function (SouvenirOrder $order) {
                return [
                    'id' => $order->id,
                    'encrypted_id' => Crypt::encryptString((string) $order->id),
                    'type' => 'souvenir',
                    'title' => 'Souvenir',
                    'city_name' => null,
                    'address' => $order->shipping_address,
                    'check_in' => null,
                    'check_out' => null,
                    'nights' => null,
                    'rooms_count' => null,
                    'guests_count' => null,
                    'visit_date' => null,
                    'quantity' => $order->items()->sum('quantity'),
                    'total' => $order->total_price,
                    'status' => $order->status,
                    'payment_status' => $order->payment_status,
                    'payment_deadline' => $order->payment_deadline?->toIso8601String(),
                    'guest_name' => $order->user?->name,
                    'guest_email' => $order->user?->email,
                    'guest_phone' => null,
                    'created_at' => $order->created_at?->toIso8601String(),
                    'midtrans_order_id' => $order->midtrans_order_id,
                    'payment_url' => route('souvenir.booking.payment', ['order' => Crypt::encryptString((string) $order->id)]),
                    'detail_url' => route('souvenir.booking.show', ['order' => Crypt::encryptString((string) $order->id)]),
                    'ticket_name' => null,
                ];
            });

        $bookings = $hotelBookings
            ->merge($wisataBookings)
            ->merge($eventBookings)
            ->merge($specialProgramBookings)
            ->merge($souvenirOrders)
            ->sortByDesc('created_at')
            ->values();

        return Inertia::render('public/history', [
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
