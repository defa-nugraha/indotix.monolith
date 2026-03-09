<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventScan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SpecialProgramScanController extends Controller
{
    public function index(Request $request): Response
    {
        $eventId = $request->integer('event_id');
        $query = EventScan::query()
            ->with(['booking.event', 'ticket'])
            ->whereHas('booking.event', fn ($q) => $q->where('event_type', 'special_program'))
            ->latest('scanned_at');
        if ($eventId) {
            $query->whereHas('booking.event', fn ($q) => $q->where('event_type', 'special_program')->where('id', $eventId));
        }

        return Inertia::render('admin/special-programs/scans/index', [
            'scans' => $query->paginate(30)->withQueryString(),
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
