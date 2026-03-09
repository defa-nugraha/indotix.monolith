<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventAttendee;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SpecialProgramAttendeeController extends Controller
{
    public function index(Request $request): Response
    {
        $eventId = $request->integer('event_id');
        $query = EventAttendee::query()
            ->with(['booking.event', 'booking.ticket'])
            ->whereHas('booking.event', fn ($q) => $q->where('event_type', 'special_program'))
            ->latest();
        if ($eventId) {
            $query->whereHas('booking.event', fn ($q) => $q->where('event_type', 'special_program')->where('id', $eventId));
        }

        return Inertia::render('admin/special-programs/attendees/index', [
            'attendees' => $query->paginate(20)->withQueryString(),
            'events' => Event::query()
                ->where('event_type', 'special_program')
                ->select('id', 'title')
                ->orderBy('title')
                ->get(),
            'filters' => [
                'event_id' => $eventId ?: null,
            ],
        ]);
    }
}
