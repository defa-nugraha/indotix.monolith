<?php

namespace App\Http\Controllers\Mitra\Event;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventOrganizer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    public function index(Request $request): Response
    {
        $organizer = EventOrganizer::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $events = Event::query()
            ->where('event_organizer_id', $organizer->id)
            ->latest('id')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('mitra/events/index', [
            'organizer' => [
                'id' => $organizer->id,
                'name' => $organizer->name,
            ],
            'events' => $events,
        ]);
    }

    public function create(Request $request): Response
    {
        $organizer = EventOrganizer::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        return Inertia::render('mitra/events/create', [
            'organizer' => [
                'id' => $organizer->id,
                'name' => $organizer->name,
            ],
            'cityOptions' => $this->cityOptions(),
            'event' => null,
        ]);
    }

    public function edit(Request $request, Event $event): Response
    {
        $organizer = EventOrganizer::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if ($event->event_organizer_id !== $organizer->id) {
            abort(403);
        }

        return Inertia::render('mitra/events/create', [
            'organizer' => [
                'id' => $organizer->id,
                'name' => $organizer->name,
            ],
            'cityOptions' => $this->cityOptions(),
            'event' => [
                'id' => $event->id,
                'title' => $event->title,
                'description' => $event->description,
                'city_code' => $event->city_code,
                'location' => $event->location,
                'address' => $event->address,
                'start_at' => $event->start_at?->format('Y-m-d\TH:i'),
                'end_at' => $event->end_at?->format('Y-m-d\TH:i'),
                'capacity_total' => $event->capacity_total,
                'status' => $event->status,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $organizer = EventOrganizer::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'city_code' => ['nullable', 'string', 'max:10'],
            'location' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'start_at' => ['required', 'date'],
            'end_at' => ['required', 'date', 'after_or_equal:start_at'],
            'capacity_total' => ['required', 'integer', 'min:0'],
        ]);

        $event = Event::create([
            'event_organizer_id' => $organizer->id,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'city_code' => $data['city_code'] ?? null,
            'location' => $data['location'] ?? null,
            'address' => $data['address'] ?? null,
            'start_at' => $data['start_at'],
            'end_at' => $data['end_at'],
            'capacity_total' => $data['capacity_total'],
            'capacity_sold' => 0,
            'sales_stopped' => false,
            'status' => 'draft',
        ]);

        return redirect()->route('mitra.events.show', $event)->with('status', 'event-created');
    }

    public function update(Request $request, Event $event): RedirectResponse
    {
        $organizer = EventOrganizer::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if ($event->event_organizer_id !== $organizer->id) {
            abort(403);
        }

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'city_code' => ['nullable', 'string', 'max:10'],
            'location' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'start_at' => ['required', 'date'],
            'end_at' => ['required', 'date', 'after_or_equal:start_at'],
            'capacity_total' => ['required', 'integer', 'min:0'],
        ]);

        $event->update([
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'city_code' => $data['city_code'] ?? null,
            'location' => $data['location'] ?? null,
            'address' => $data['address'] ?? null,
            'start_at' => $data['start_at'],
            'end_at' => $data['end_at'],
            'capacity_total' => $data['capacity_total'],
        ]);

        return back()->with('status', 'event-updated');
    }

    public function show(Request $request, Event $event): Response
    {
        $organizer = EventOrganizer::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if ($event->event_organizer_id !== $organizer->id) {
            abort(403);
        }

        $event->load('tickets');

        return Inertia::render('mitra/events/show', [
            'organizer' => [
                'id' => $organizer->id,
                'name' => $organizer->name,
            ],
            'event' => $event,
        ]);
    }

    public function submit(Request $request, Event $event): RedirectResponse
    {
        $organizer = EventOrganizer::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if ($event->event_organizer_id !== $organizer->id) {
            abort(403);
        }

        $event->update([
            'status' => 'pending_review',
        ]);

        return back()->with('status', 'event-submitted');
    }

    private function cityOptions(): array
    {
        return DB::table('regencies')
            ->select('code', 'name', 'type')
            ->orderBy('name')
            ->get()
            ->map(fn ($row) => [
                'code' => $row->code,
                'label' => trim(sprintf('%s %s', $row->type ?? 'Kabupaten', $row->name)),
            ])
            ->all();
    }
}
