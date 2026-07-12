<?php

namespace App\Http\Controllers\Mitra\Event;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventOrganizer;
use App\Models\EventTicket;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class TicketController extends Controller
{
    public function index(Request $request): Response
    {
        $organizer = EventOrganizer::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $tickets = EventTicket::query()
            ->with('event')
            ->whereHas('event', fn ($query) => $query->where('event_organizer_id', $organizer->id))
            ->latest('id')
            ->get()
            ->map(fn (EventTicket $ticket) => [
                'id' => $ticket->id,
                'name' => $ticket->name,
                'price' => $ticket->price,
                'quota' => $ticket->quota,
                'max_per_user' => $ticket->max_per_user,
                'is_active' => $ticket->is_active,
                'event' => [
                    'id' => $ticket->event?->id,
                    'title' => $ticket->event?->title,
                ],
            ]);

        $events = Event::query()
            ->where('event_organizer_id', $organizer->id)
            ->orderBy('title')
            ->get(['id', 'title']);

        return Inertia::render('mitra/events/tickets/index', [
            'organizer' => [
                'id' => $organizer->id,
                'name' => $organizer->name,
            ],
            'tickets' => $tickets,
            'events' => $events,
        ]);
    }

    public function create(Request $request): Response
    {
        $organizer = EventOrganizer::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $ticketId = $request->integer('edit') ?: null;
        $ticket = null;
        if ($ticketId) {
            $ticket = EventTicket::query()
                ->where('id', $ticketId)
                ->whereHas('event', fn ($query) => $query->where('event_organizer_id', $organizer->id))
                ->first();
        }

        $events = Event::query()
            ->where('event_organizer_id', $organizer->id)
            ->orderBy('title')
            ->get(['id', 'title']);

        return Inertia::render('mitra/events/tickets/create', [
            'organizer' => [
                'id' => $organizer->id,
                'name' => $organizer->name,
            ],
            'ticket' => $ticket ? [
                'id' => $ticket->id,
                'event_id' => $ticket->event_id,
                'name' => $ticket->name,
                'description' => $ticket->description,
                'price' => $ticket->price,
                'quota' => $ticket->quota,
                'max_per_user' => $ticket->max_per_user,
                'benefits' => $ticket->benefits,
                'is_active' => $ticket->is_active,
            ] : null,
            'events' => $events,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $organizer = $this->ownedOrganizer($request);

        $data = $request->validate([
            'event_id' => [
                'required',
                'integer',
                Rule::exists('events', 'id')->where('event_organizer_id', $organizer->id),
            ],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'integer', 'min:0'],
            'quota' => ['nullable', 'integer', 'min:0'],
            'max_per_user' => ['required', 'integer', 'min:1'],
            'benefits' => ['nullable', 'array'],
            'benefits.*' => ['string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $event = Event::query()
            ->where('event_organizer_id', $organizer->id)
            ->where('id', $data['event_id'])
            ->firstOrFail();

        EventTicket::create([
            'event_id' => $event->id,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'price' => $data['price'],
            'quota' => $data['quota'] ?? null,
            'max_per_user' => $data['max_per_user'],
            'benefits' => $data['benefits'] ?? [],
            'is_active' => (bool) ($data['is_active'] ?? false),
            'sold_count' => 0,
        ]);

        return redirect()->route('mitra.events.tickets.index')->with('status', 'ticket-created');
    }

    public function update(Request $request, EventTicket $ticket): RedirectResponse
    {
        $organizer = $this->ownedOrganizer($request);

        if (! $ticket->event || $ticket->event->event_organizer_id !== $organizer->id) {
            abort(403);
        }

        $data = $request->validate([
            'event_id' => [
                'required',
                'integer',
                Rule::exists('events', 'id')->where('event_organizer_id', $organizer->id),
            ],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'integer', 'min:0'],
            'quota' => ['nullable', 'integer', 'min:0'],
            'max_per_user' => ['required', 'integer', 'min:1'],
            'benefits' => ['nullable', 'array'],
            'benefits.*' => ['string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $event = Event::query()
            ->where('event_organizer_id', $organizer->id)
            ->where('id', $data['event_id'])
            ->firstOrFail();

        $ticket->update([
            'event_id' => $event->id,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'price' => $data['price'],
            'quota' => $data['quota'] ?? null,
            'max_per_user' => $data['max_per_user'],
            'benefits' => $data['benefits'] ?? [],
            'is_active' => (bool) ($data['is_active'] ?? false),
        ]);

        return back()->with('status', 'ticket-updated');
    }

    public function destroy(Request $request, EventTicket $ticket): RedirectResponse
    {
        $organizer = $this->ownedOrganizer($request);

        if (! $ticket->event || $ticket->event->event_organizer_id !== $organizer->id) {
            abort(403);
        }

        $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $ticket->delete();

        return back()->with('status', 'ticket-deleted');
    }

    private function ownedOrganizer(Request $request): EventOrganizer
    {
        $organizer = EventOrganizer::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if ($organizer->status === 'suspended') {
            throw ValidationException::withMessages([
                'event_id' => 'Organizer sedang disuspend oleh admin. Mitra tidak dapat mengubah tiket event.',
            ]);
        }

        return $organizer;
    }
}
