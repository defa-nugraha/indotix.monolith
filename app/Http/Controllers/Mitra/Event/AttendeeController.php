<?php

namespace App\Http\Controllers\Mitra\Event;

use App\Http\Controllers\Controller;
use App\Models\EventAttendee;
use App\Models\EventOrganizer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AttendeeController extends Controller
{
    public function index(Request $request): Response
    {
        $organizer = EventOrganizer::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $query = EventAttendee::query()
            ->with(['booking.event', 'booking.ticket'])
            ->whereHas('booking.event', fn ($q) => $q->where('event_organizer_id', $organizer->id));

        if ($status = $request->string('checked_in')->toString()) {
            $query->where('checked_in', $status === 'yes');
        }

        $attendees = $query->latest('id')
            ->paginate(\App\Support\PaginationOptions::perPage())
            ->withQueryString();

        return Inertia::render('mitra/events/attendees/index', [
            'organizer' => [
                'id' => $organizer->id,
                'name' => $organizer->name,
            ],
            'attendees' => $attendees,
            'filters' => [
                'checked_in' => $request->string('checked_in')->toString(),
            ],
        ]);
    }
}
