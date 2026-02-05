<?php

namespace App\Http\Controllers\Admin\Academy;

use App\Http\Controllers\Controller;
use App\Models\AcademyAuditLog;
use App\Models\AcademyClass;
use App\Models\AcademyTicket;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TicketController extends Controller
{
    public function index(Request $request): Response
    {
        $classId = $request->integer('class_id');
        $query = AcademyTicket::query()->with('academyClass')->latest('id');
        if ($classId) {
            $query->where('academy_class_id', $classId);
        }

        return Inertia::render('admin/academy/tickets/index', [
            'tickets' => $query->paginate(20)->withQueryString(),
            'classes' => AcademyClass::query()->select('id', 'title')->orderBy('title')->get(),
            'filters' => ['class_id' => $classId ?: null],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'academy_class_id' => ['required', 'exists:academy_classes,id'],
            'name' => ['required', 'string', 'max:255'],
            'price' => ['required', 'integer', 'min:0'],
            'quota' => ['nullable', 'integer', 'min:0'],
            'ticket_type' => ['required', 'in:regular,early_bird,vip'],
            'refundable' => ['required', 'boolean'],
            'sales_start_at' => ['nullable', 'date'],
            'sales_end_at' => ['nullable', 'date'],
            'is_active' => ['required', 'boolean'],
        ]);

        $ticket = AcademyTicket::create($data);

        AcademyAuditLog::create([
            'admin_id' => $request->user()->id,
            'action' => 'academy_ticket_created',
            'subject_type' => AcademyTicket::class,
            'subject_id' => $ticket->id,
            'metadata' => $data,
        ]);

        return back()->with('status', 'ticket-created');
    }

    public function update(Request $request, AcademyTicket $ticket): RedirectResponse
    {
        $data = $request->validate([
            'academy_class_id' => ['required', 'exists:academy_classes,id'],
            'name' => ['required', 'string', 'max:255'],
            'price' => ['required', 'integer', 'min:0'],
            'quota' => ['nullable', 'integer', 'min:0'],
            'ticket_type' => ['required', 'in:regular,early_bird,vip'],
            'refundable' => ['required', 'boolean'],
            'sales_start_at' => ['nullable', 'date'],
            'sales_end_at' => ['nullable', 'date'],
            'is_active' => ['required', 'boolean'],
        ]);

        $ticket->update($data);

        AcademyAuditLog::create([
            'admin_id' => $request->user()->id,
            'action' => 'academy_ticket_updated',
            'subject_type' => AcademyTicket::class,
            'subject_id' => $ticket->id,
            'metadata' => $data,
        ]);

        return back()->with('status', 'ticket-updated');
    }
}
