<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventAuditLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->string('status')->toString();
        $query = Event::query()->with('organizer')->latest();
        if ($status) {
            $query->where('status', $status);
        }

        return Inertia::render('admin/events/index', [
            'events' => $query->paginate(20)->withQueryString(),
            'filters' => [
                'status' => $status,
            ],
        ]);
    }

    public function show(Event $event): Response
    {
        $event->load('organizer', 'tickets');

        return Inertia::render('admin/events/show', [
            'event' => $event,
        ]);
    }

    public function updateStatus(Request $request, Event $event): RedirectResponse
    {
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
}
