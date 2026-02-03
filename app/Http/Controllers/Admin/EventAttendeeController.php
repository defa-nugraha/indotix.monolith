<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventAttendee;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EventAttendeeController extends Controller
{
    public function index(Request $request): Response
    {
        $eventId = $request->integer('event_id');
        $query = EventAttendee::query()->with(['booking.event', 'booking.ticket'])->latest();
        if ($eventId) {
            $query->whereHas('booking', fn ($q) => $q->where('event_id', $eventId));
        }

        return Inertia::render('admin/events/attendees/index', [
            'attendees' => $query->paginate(20)->withQueryString(),
            'events' => Event::query()->select('id', 'title')->orderBy('title')->get(),
            'filters' => [
                'event_id' => $eventId ?: null,
            ],
        ]);
    }
}
