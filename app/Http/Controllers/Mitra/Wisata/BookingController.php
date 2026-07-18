<?php

namespace App\Http\Controllers\Mitra\Wisata;

use App\Http\Controllers\Controller;
use App\Models\MitraWisataOnboarding;
use App\Models\WisataBooking;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BookingController extends Controller
{
    public function index(Request $request): Response
    {
        $destination = MitraWisataOnboarding::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $query = WisataBooking::query()
            ->with(['ticket:id,name', 'user:id,name,email'])
            ->where('mitra_wisata_onboarding_id', $destination->id);

        if ($date = $request->string('visit_date')->toString()) {
            $query->whereDate('visit_date', $date);
        }

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        $bookings = $query->latest('id')
            ->paginate(\App\Support\PaginationOptions::perPage())
            ->withQueryString()
            ->through(fn (WisataBooking $booking) => [
                'id' => $booking->id,
                'booking_code' => $booking->booking_code,
                'visit_date' => $booking->visit_date->toDateString(),
                'quantity' => $booking->quantity,
                'total_price' => $booking->total_price,
                'status' => $booking->status,
                'ticket' => [
                    'id' => $booking->ticket?->id,
                    'name' => $booking->ticket?->name,
                ],
                'user' => [
                    'id' => $booking->user?->id,
                    'name' => $booking->user?->name,
                    'email' => $booking->user?->email,
                ],
            ]);

        return Inertia::render('mitra/wisata/bookings/index', [
            'destination' => [
                'id' => $destination->id,
                'destination_name' => $destination->destination_name,
            ],
            'bookings' => $bookings,
            'filters' => [
                'visit_date' => $request->string('visit_date')->toString(),
                'status' => $request->string('status')->toString(),
            ],
        ]);
    }

    public function show(Request $request, WisataBooking $booking): Response
    {
        $destination = MitraWisataOnboarding::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if ($booking->mitra_wisata_onboarding_id !== $destination->id) {
            abort(403);
        }

        $booking->load(['ticket', 'items.ticket', 'user', 'disputes']);

        return Inertia::render('mitra/wisata/bookings/show', [
            'destination' => [
                'id' => $destination->id,
                'destination_name' => $destination->destination_name,
            ],
            'booking' => [
                'id' => $booking->id,
                'booking_code' => $booking->booking_code,
                'visit_date' => $booking->visit_date->toDateString(),
                'quantity' => $booking->quantity,
                'unit_price' => $booking->unit_price,
                'total_price' => $booking->total_price,
                'status' => $booking->status,
                'ticket' => [
                    'id' => $booking->ticket?->id,
                    'name' => $booking->ticket?->name,
                ],
                'items' => $booking->items->isNotEmpty()
                    ? $booking->items->map(fn ($item) => [
                        'ticket_id' => $item->wisata_ticket_id,
                        'name' => $item->ticket_name ?? $item->ticket?->name ?? 'Tiket Wisata',
                        'quantity' => $item->quantity,
                        'unit_price' => $item->unit_price,
                        'subtotal' => $item->subtotal,
                    ])->values()->all()
                    : [[
                        'ticket_id' => $booking->wisata_ticket_id,
                        'name' => $booking->ticket?->name ?? 'Tiket Wisata',
                        'quantity' => $booking->quantity,
                        'unit_price' => $booking->unit_price,
                        'subtotal' => $booking->total_price,
                    ]],
                'user' => [
                    'id' => $booking->user?->id,
                    'name' => $booking->user?->name,
                    'email' => $booking->user?->email,
                ],
                'disputes' => $booking->disputes->map(fn ($item) => [
                    'id' => $item->id,
                    'subject' => $item->subject,
                    'status' => $item->status,
                    'description' => $item->description,
                ]),
            ],
        ]);
    }
}
