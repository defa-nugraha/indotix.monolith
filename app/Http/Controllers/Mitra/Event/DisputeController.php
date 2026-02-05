<?php

namespace App\Http\Controllers\Mitra\Event;

use App\Http\Controllers\Controller;
use App\Models\EventBooking;
use App\Models\EventDispute;
use App\Models\EventOrganizer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DisputeController extends Controller
{
    public function index(Request $request): Response
    {
        $organizer = EventOrganizer::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $disputes = EventDispute::query()
            ->with(['booking', 'ticket'])
            ->whereHas('booking.event', fn ($q) => $q->where('event_organizer_id', $organizer->id))
            ->latest('id')
            ->get()
            ->map(fn (EventDispute $item) => [
                'id' => $item->id,
                'subject' => $item->subject,
                'status' => $item->status,
                'description' => $item->description,
                'attachment_path' => $item->attachment_path,
                'booking_code' => $item->booking?->booking_code,
                'ticket_name' => $item->ticket?->name,
            ]);

        $bookings = EventBooking::query()
            ->whereHas('event', fn ($q) => $q->where('event_organizer_id', $organizer->id))
            ->latest('id')
            ->take(50)
            ->get(['id', 'booking_code'])
            ->map(fn ($item) => ['id' => $item->id, 'label' => $item->booking_code]);

        return Inertia::render('mitra/events/disputes/index', [
            'organizer' => [
                'id' => $organizer->id,
                'name' => $organizer->name,
            ],
            'disputes' => $disputes,
            'bookings' => $bookings,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $organizer = EventOrganizer::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $data = $request->validate([
            'event_booking_id' => ['required', 'exists:event_bookings,id'],
            'subject' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:2000'],
            'attachment' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:4096'],
        ]);

        $booking = EventBooking::query()
            ->where('id', $data['event_booking_id'])
            ->whereHas('event', fn ($q) => $q->where('event_organizer_id', $organizer->id))
            ->firstOrFail();

        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')
                ->store("mitra-event/{$organizer->id}/disputes", 'public');
        }

        EventDispute::create([
            'event_booking_id' => $booking->id,
            'event_ticket_id' => $booking->event_ticket_id,
            'user_id' => $request->user()->id,
            'subject' => $data['subject'],
            'description' => $data['description'],
            'attachment_path' => $attachmentPath,
            'status' => 'open',
        ]);

        return back()->with('status', 'dispute-created');
    }
}
