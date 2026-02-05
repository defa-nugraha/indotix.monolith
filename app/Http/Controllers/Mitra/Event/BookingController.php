<?php

namespace App\Http\Controllers\Mitra\Event;

use App\Http\Controllers\Controller;
use App\Models\EventBooking;
use App\Models\EventOrganizer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BookingController extends Controller
{
    public function index(Request $request): Response
    {
        $organizer = EventOrganizer::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $query = EventBooking::query()
            ->with(['event', 'ticket', 'user'])
            ->whereHas('event', fn ($q) => $q->where('event_organizer_id', $organizer->id));

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        if ($date = $request->string('date')->toString()) {
            $query->whereDate('created_at', $date);
        }

        $bookings = $query->latest('id')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('mitra/events/bookings/index', [
            'organizer' => [
                'id' => $organizer->id,
                'name' => $organizer->name,
            ],
            'bookings' => $bookings,
            'filters' => [
                'status' => $request->string('status')->toString(),
                'date' => $request->string('date')->toString(),
            ],
        ]);
    }

    public function show(Request $request, EventBooking $booking): Response
    {
        $organizer = EventOrganizer::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if (! $booking->event || $booking->event->event_organizer_id !== $organizer->id) {
            abort(403);
        }

        $booking->load(['event', 'ticket', 'user', 'attendees', 'scans']);

        return Inertia::render('mitra/events/bookings/show', [
            'organizer' => [
                'id' => $organizer->id,
                'name' => $organizer->name,
            ],
            'booking' => $booking,
        ]);
    }
}
