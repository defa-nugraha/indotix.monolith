<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventBooking;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EventBookingController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->string('status')->toString();
        $eventId = $request->integer('event_id');
        $date = $request->string('date')->toString();

        $query = EventBooking::query()
            ->with(['event', 'ticket', 'user'])
            ->whereHas('event', fn ($q) => $q->where('event_type', 'event'))
            ->latest();
        if ($status) {
            $query->where('status', $status);
        }
        if ($eventId) {
            $query->where('event_id', $eventId);
        }
        if ($date) {
            $query->whereDate('created_at', $date);
        }

        return Inertia::render('admin/events/bookings/index', [
            'bookings' => $query->paginate(20)->withQueryString(),
            'events' => Event::query()
                ->where('event_type', 'event')
                ->select('id', 'title')
                ->orderBy('title')
                ->get(),
            'filters' => [
                'status' => $status,
                'event_id' => $eventId ?: null,
                'date' => $date,
            ],
        ]);
    }

    public function show(EventBooking $booking): Response
    {
        $booking->load(['event', 'ticket', 'user', 'attendees', 'scans']);
        abort_unless($booking->event?->event_type === 'event', 404);

        return Inertia::render('admin/events/bookings/show', [
            'booking' => $booking,
        ]);
    }
}
