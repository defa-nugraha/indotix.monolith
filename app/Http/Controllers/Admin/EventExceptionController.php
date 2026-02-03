<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventAuditLog;
use App\Models\EventBooking;
use App\Models\EventRefund;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EventExceptionController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/events/exceptions/index');
    }

    public function updateEvent(Request $request, Event $event): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:postponed,cancelled'],
            'reason' => ['required', 'string'],
        ]);

        $event->update([
            'status' => $data['status'],
            'status_reason' => $data['reason'],
        ]);

        EventAuditLog::create([
            'admin_id' => $request->user()->id,
            'action' => 'event_exception_updated',
            'subject_type' => Event::class,
            'subject_id' => $event->id,
            'metadata' => $data,
        ]);

        return back();
    }

    public function refund(Request $request, EventBooking $booking): RedirectResponse
    {
        $data = $request->validate([
            'amount' => ['required', 'numeric', 'min:0'],
            'reason' => ['required', 'string'],
        ]);

        EventRefund::create([
            'event_booking_id' => $booking->id,
            'amount' => $data['amount'],
            'status' => 'requested',
            'reason' => $data['reason'],
            'processed_by' => $request->user()->id,
        ]);

        EventAuditLog::create([
            'admin_id' => $request->user()->id,
            'action' => 'event_refund_created',
            'subject_type' => EventBooking::class,
            'subject_id' => $booking->id,
            'metadata' => $data,
        ]);

        return back();
    }
}
