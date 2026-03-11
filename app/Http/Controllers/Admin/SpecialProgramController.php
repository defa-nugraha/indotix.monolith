<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventAuditLog;
use App\Models\EventOrganizer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SpecialProgramController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->string('status')->toString();
        $query = Event::query()
            ->where('event_type', 'special_program')
            ->latest();
        if ($status) {
            $query->where('status', $status);
        }

        return Inertia::render('admin/special-programs/index', [
            'programs' => $query->paginate(20)->withQueryString(),
            'filters' => [
                'status' => $status,
            ],
        ]);
    }

    public function create(): Response
    {
        $organizer = $this->resolveOrganizer();

        return Inertia::render('admin/special-programs/create', [
            'organizer' => [
                'id' => $organizer->id,
                'name' => $organizer->name,
            ],
            'cityOptions' => $this->cityOptions(),
            'event' => null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $organizer = $this->resolveOrganizer();

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
            'event_type' => 'special_program',
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

        EventAuditLog::create([
            'admin_id' => $request->user()->id,
            'action' => 'special_program_created',
            'subject_type' => Event::class,
            'subject_id' => $event->id,
            'metadata' => $data,
        ]);

        return redirect()->route('admin.special-programs.show', $event)->with('status', 'special-program-created');
    }

    public function edit(Event $event): Response
    {
        abort_unless($event->event_type === 'special_program', 404);

        $organizer = $this->resolveOrganizer();

        return Inertia::render('admin/special-programs/create', [
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
                'start_at' => $event->start_at?->format('Y-m-d\\TH:i'),
                'end_at' => $event->end_at?->format('Y-m-d\\TH:i'),
                'capacity_total' => $event->capacity_total,
                'status' => $event->status,
            ],
        ]);
    }

    public function update(Request $request, Event $event): RedirectResponse
    {
        abort_unless($event->event_type === 'special_program', 404);

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

        EventAuditLog::create([
            'admin_id' => $request->user()->id,
            'action' => 'special_program_updated',
            'subject_type' => Event::class,
            'subject_id' => $event->id,
            'metadata' => $data,
        ]);

        return back()->with('status', 'special-program-updated');
    }

    public function show(Event $event): Response
    {
        abort_unless($event->event_type === 'special_program', 404);
        $event->load('tickets');

        return Inertia::render('admin/special-programs/show', [
            'event' => $event,
        ]);
    }

    public function updateStatus(Request $request, Event $event): RedirectResponse
    {
        abort_unless($event->event_type === 'special_program', 404);

        $data = $request->validate([
            'status' => ['required', 'in:draft,pending_review,published,postponed,cancelled,completed'],
            'status_reason' => ['nullable', 'string'],
        ]);

        $event->update([
            'status' => $data['status'],
            'status_reason' => $data['status_reason'] ?? $event->status_reason,
            'published_at' => $data['status'] === 'published' ? now() : $event->published_at,
        ]);

        EventAuditLog::create([
            'admin_id' => $request->user()->id,
            'action' => 'special_program_status_updated',
            'subject_type' => Event::class,
            'subject_id' => $event->id,
            'metadata' => $data,
        ]);

        return back();
    }

    public function updateCapacity(Request $request, Event $event): RedirectResponse
    {
        abort_unless($event->event_type === 'special_program', 404);

        $data = $request->validate([
            'capacity_total' => ['required', 'integer', 'min:0'],
            'sales_stopped' => ['required', 'boolean'],
        ]);

        $event->update($data);

        EventAuditLog::create([
            'admin_id' => $request->user()->id,
            'action' => 'special_program_capacity_updated',
            'subject_type' => Event::class,
            'subject_id' => $event->id,
            'metadata' => $data,
        ]);

        return back();
    }

    private function resolveOrganizer(): EventOrganizer
    {
        return EventOrganizer::query()->firstOrCreate(
            ['user_id' => null, 'name' => 'Indotix Special Program'],
            [
                'email' => null,
                'phone' => null,
                'status' => 'verified',
                'notes' => 'Organizer internal untuk special program.',
            ]
        );
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
