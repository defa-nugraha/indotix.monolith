<?php

namespace App\Http\Controllers\Mitra\Event;

use App\Http\Controllers\Controller;
use App\Models\EventAttendee;
use App\Models\EventBooking;
use App\Models\EventOrganizer;
use App\Models\EventScan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ScanController extends Controller
{
    public function index(Request $request): Response
    {
        $organizer = EventOrganizer::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $query = EventScan::query()
            ->with(['booking.event', 'ticket'])
            ->whereHas('booking.event', fn ($q) => $q->where('event_organizer_id', $organizer->id));

        if ($date = $request->string('date')->toString()) {
            $query->whereDate('scanned_at', $date);
        }

        $scans = $query->latest('scanned_at')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (EventScan $scan) => [
                'id' => $scan->id,
                'scanned_at' => $scan->scanned_at?->format('Y-m-d H:i'),
                'officer_name' => $scan->officer_name,
                'location' => $scan->location,
                'is_anomaly' => $scan->is_anomaly,
                'booking' => [
                    'booking_code' => $scan->booking?->booking_code,
                    'event_title' => $scan->booking?->event?->title,
                    'ticket_name' => $scan->ticket?->name,
                ],
            ]);

        return Inertia::render('mitra/events/scans/index', [
            'organizer' => [
                'id' => $organizer->id,
                'name' => $organizer->name,
            ],
            'scans' => $scans,
            'filters' => [
                'date' => $request->string('date')->toString(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $organizer = EventOrganizer::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $data = $request->validate([
            'booking_code' => ['required', 'string'],
            'officer_name' => ['nullable', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
        ]);

        $booking = EventBooking::query()
            ->where('booking_code', $data['booking_code'])
            ->whereHas('event', fn ($q) => $q->where('event_organizer_id', $organizer->id))
            ->with('event')
            ->firstOrFail();

        if (! in_array($booking->status, ['paid', 'completed'], true)) {
            return back()->withErrors(['booking_code' => 'Booking belum dibayar atau tidak valid.']);
        }

        $existingScan = EventScan::query()
            ->where('event_booking_id', $booking->id)
            ->latest('scanned_at')
            ->first();

        $scan = EventScan::create([
            'event_booking_id' => $booking->id,
            'event_ticket_id' => $booking->event_ticket_id,
            'scanned_at' => now(),
            'officer_name' => $data['officer_name'] ?? null,
            'location' => $data['location'] ?? null,
            'is_anomaly' => (bool) $existingScan,
        ]);

        EventAttendee::query()
            ->where('event_booking_id', $booking->id)
            ->update([
                'checked_in' => true,
                'checked_in_at' => now(),
            ]);

        return back()->with('status', $scan->is_anomaly ? 'scan-anomaly' : 'scan-success');
    }
}
