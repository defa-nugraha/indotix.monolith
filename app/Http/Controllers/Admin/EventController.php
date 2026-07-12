<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventAuditLog;
use App\Models\EventOrganizer;
use App\Services\MediaCompressionService;
use App\Support\AdminDataScope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->string('status')->toString();
        $query = Event::query()
            ->where('event_type', 'event')
            ->with('organizer')
            ->latest();
        $this->applyEventScope($query, $request);

        if ($request->filled('q')) {
            $term = '%'.$request->string('q')->toString().'%';
            $query->where(function (Builder $builder) use ($term) {
                $builder->where('title', 'like', $term)
                    ->orWhere('location', 'like', $term)
                    ->orWhere('address', 'like', $term);
            });
        }

        if ($request->filled('organizer_id')) {
            $query->where('event_organizer_id', (int) $request->input('organizer_id'));
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('start_at', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('start_at', '<=', $request->input('date_to'));
        }

        if ($request->filled('capacity_state')) {
            match ($request->string('capacity_state')->toString()) {
                'available' => $query->whereColumn('capacity_sold', '<', 'capacity_total'),
                'sold_out' => $query->whereColumn('capacity_sold', '>=', 'capacity_total'),
                'sales_stopped' => $query->where('sales_stopped', true),
                default => null,
            };
        }

        return Inertia::render('admin/events/index', [
            'events' => $query->paginate(\App\Support\PaginationOptions::perPage())->withQueryString(),
            'filters' => [
                'q' => $request->input('q'),
                'organizer_id' => $request->input('organizer_id'),
                'status' => $status,
                'date_from' => $request->input('date_from'),
                'date_to' => $request->input('date_to'),
                'capacity_state' => $request->input('capacity_state'),
            ],
            'organizerOptions' => $this->organizerOptions(),
        ]);
    }

    public function create(): Response
    {
        $organizerOptions = $this->organizerOptions();

        return Inertia::render('mitra/events/create', [
            'organizer' => [
                'id' => $organizerOptions[0]['id'] ?? null,
                'name' => AdminDataScope::canViewAll(request()->user()) ? 'Admin' : ($organizerOptions[0]['name'] ?? request()->user()?->name),
            ],
            'organizerOptions' => $organizerOptions,
            'cityOptions' => $this->cityOptions(),
            'basePath' => '/admin/events',
            'event' => null,
        ]);
    }

    public function store(Request $request, MediaCompressionService $mediaCompression): RedirectResponse
    {
        $data = $this->validateEvent($request);
        $imagePath = $request->hasFile('image')
            ? $mediaCompression->store($request->file('image'), 'events', 'public')
            : null;

        $event = Event::create([
            'event_organizer_id' => $data['event_organizer_id'],
            'event_type' => 'event',
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'image_path' => $imagePath,
            'city_code' => $data['city_code'] ?? null,
            'location' => $data['location'] ?? null,
            'address' => $data['address'] ?? null,
            'start_at' => $data['start_at'],
            'end_at' => $data['end_at'],
            'capacity_total' => $data['capacity_total'],
            'capacity_sold' => 0,
            'sales_stopped' => false,
            'status' => $data['status'] ?? 'draft',
            'published_at' => ($data['status'] ?? null) === 'published' ? now() : null,
        ]);

        $this->audit($request, $event, 'event_created', $data);

        return redirect()->route('admin.events.show', $event)->with('status', 'event-created');
    }

    public function edit(Event $event): Response
    {
        abort_unless($event->event_type === 'event', 404);
        $this->authorizeEvent($event, request());

        return Inertia::render('mitra/events/create', [
            'organizer' => [
                'id' => $event->event_organizer_id,
                'name' => $event->organizer?->name,
            ],
            'organizerOptions' => $this->organizerOptions(),
            'cityOptions' => $this->cityOptions(),
            'basePath' => '/admin/events',
            'event' => [
                'id' => $event->id,
                'event_organizer_id' => $event->event_organizer_id,
                'title' => $event->title,
                'description' => $event->description,
                'city_code' => $event->city_code,
                'location' => $event->location,
                'address' => $event->address,
                'image_url' => $event->image_path ? Storage::url($event->image_path) : null,
                'start_at' => $event->start_at?->format('Y-m-d\TH:i'),
                'end_at' => $event->end_at?->format('Y-m-d\TH:i'),
                'capacity_total' => $event->capacity_total,
                'status' => $event->status,
            ],
        ]);
    }

    public function update(Request $request, Event $event, MediaCompressionService $mediaCompression): RedirectResponse
    {
        abort_unless($event->event_type === 'event', 404);
        $this->authorizeEvent($event, $request);

        $data = $this->validateEvent($request);
        $imagePath = $event->image_path;
        if ($request->hasFile('image')) {
            $oldPath = $event->image_path;
            $imagePath = $mediaCompression->store($request->file('image'), 'events', 'public');
            if ($oldPath) {
                Storage::disk('public')->delete($oldPath);
            }
        }

        $event->update([
            'event_organizer_id' => $data['event_organizer_id'],
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'image_path' => $imagePath,
            'city_code' => $data['city_code'] ?? null,
            'location' => $data['location'] ?? null,
            'address' => $data['address'] ?? null,
            'start_at' => $data['start_at'],
            'end_at' => $data['end_at'],
            'capacity_total' => $data['capacity_total'],
            'status' => $data['status'] ?? $event->status,
            'published_at' => ($data['status'] ?? null) === 'published' && ! $event->published_at ? now() : $event->published_at,
        ]);

        $this->audit($request, $event, 'event_updated', $data);

        return redirect()->route('admin.events.show', $event)->with('status', 'event-updated');
    }

    public function show(Event $event): Response
    {
        abort_unless($event->event_type === 'event', 404);
        $this->authorizeEvent($event, request());
        $event->load('organizer', 'tickets');

        return Inertia::render('admin/events/show', [
            'event' => $event,
        ]);
    }

    public function updateStatus(Request $request, Event $event): RedirectResponse
    {
        $this->authorizeEvent($event, $request);

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
            'action' => 'event_status_updated',
            'subject_type' => Event::class,
            'subject_id' => $event->id,
            'metadata' => $data,
        ]);

        return back();
    }

    public function updateCapacity(Request $request, Event $event): RedirectResponse
    {
        $this->authorizeEvent($event, $request);

        $data = $request->validate([
            'capacity_total' => ['required', 'integer', 'min:0'],
            'sales_stopped' => ['required', 'boolean'],
        ]);

        $event->update($data);

        EventAuditLog::create([
            'admin_id' => $request->user()->id,
            'action' => 'event_capacity_updated',
            'subject_type' => Event::class,
            'subject_id' => $event->id,
            'metadata' => $data,
        ]);

        return back();
    }

    public function destroy(Request $request, Event $event): RedirectResponse
    {
        abort_unless($event->event_type === 'event', 404);
        $this->authorizeEvent($event, $request);

        if ($event->bookings()->exists()) {
            return back()->withErrors([
                'event' => 'Event tidak dapat dihapus karena sudah memiliki booking.',
            ]);
        }

        if ($event->image_path) {
            Storage::disk('public')->delete($event->image_path);
        }

        $this->audit($request, $event, 'event_deleted', ['title' => $event->title]);
        $event->delete();

        return redirect()->route('admin.events.index')->with('status', 'event-deleted');
    }

    private function validateEvent(Request $request): array
    {
        if (! AdminDataScope::canViewAll($request->user()) && ! $request->filled('event_organizer_id')) {
            $request->merge([
                'event_organizer_id' => $this->ownedOrganizerFor($request)->id,
            ]);
        }

        $organizerRule = Rule::exists('event_organizers', 'id');
        if (! AdminDataScope::canViewAll($request->user())) {
            $organizerRule = $organizerRule->where('user_id', $request->user()?->id ?? 0);
        }

        return $request->validate([
            'event_organizer_id' => ['required', 'integer', $organizerRule],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'city_code' => ['nullable', 'string', 'max:10'],
            'location' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'start_at' => ['required', 'date'],
            'end_at' => ['required', 'date', 'after_or_equal:start_at'],
            'capacity_total' => ['required', 'integer', 'min:0'],
            'status' => ['nullable', 'in:draft,pending_review,published,postponed,cancelled,completed'],
            'image' => ['nullable', 'file', 'image', 'max:5120'],
        ]);
    }

    private function organizerOptions(): array
    {
        if (! AdminDataScope::canViewAll(request()->user())) {
            $this->ownedOrganizerFor(request());
        }

        return EventOrganizer::query()
            ->when(! AdminDataScope::canViewAll(request()->user()), fn ($query) => $query
                ->where('user_id', request()->user()?->id ?? 0))
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (EventOrganizer $organizer) => [
                'id' => $organizer->id,
                'name' => $organizer->name,
            ])
            ->all();
    }

    private function ownedOrganizerFor(Request $request): EventOrganizer
    {
        $user = $request->user();

        return EventOrganizer::query()->firstOrCreate(
            ['user_id' => $user?->id],
            [
                'name' => $user?->name ?: 'Operator Event',
                'email' => $user?->email,
                'phone' => $user?->phone,
                'status' => 'verified',
                'notes' => 'Organizer otomatis untuk akun RBAC event.',
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

    private function audit(Request $request, Event $event, string $action, array $metadata): void
    {
        EventAuditLog::create([
            'admin_id' => $request->user()->id,
            'action' => $action,
            'subject_type' => Event::class,
            'subject_id' => $event->id,
            'metadata' => $metadata,
        ]);
    }

    private function applyEventScope(Builder $query, Request $request): Builder
    {
        if (AdminDataScope::canViewAll($request->user())) {
            return $query;
        }

        return $query->whereHas('organizer', fn ($organizer) => $organizer
            ->where('user_id', $request->user()?->id ?? 0));
    }

    private function authorizeEvent(Event $event, Request $request): void
    {
        if (AdminDataScope::canViewAll($request->user())) {
            return;
        }

        $event->loadMissing('organizer');
        abort_unless((int) $event->organizer?->user_id === (int) ($request->user()?->id ?? 0), 404);
    }
}
