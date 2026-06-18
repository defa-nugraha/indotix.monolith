<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SpecialProgram;
use App\Models\SpecialProgramVariant;
use App\Support\AdminDataScope;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SpecialProgramTicketController extends Controller
{
    public function index(Request $request): Response
    {
        $programId = $request->integer('program_id');
        $query = SpecialProgramVariant::query()
            ->with('program')
            ->whereHas('program', fn ($builder) => AdminDataScope::applyCreatedBy($builder, $request))
            ->latest();
        if ($programId) {
            $query->where('special_program_id', $programId);
        }

        return Inertia::render('admin/special-programs/tickets/index', [
            'tickets' => $query->paginate(\App\Support\PaginationOptions::perPage())->withQueryString(),
            'programs' => AdminDataScope::applyCreatedBy(SpecialProgram::query(), $request)
                ->select('id', 'name')
                ->orderBy('name')
                ->get(),
            'filters' => [
                'program_id' => $programId ?: null,
            ],
        ]);
    }

    public function update(Request $request, SpecialProgramVariant $ticket): RedirectResponse
    {
        $ticket->loadMissing('program');
        if (! $ticket->program) {
            abort(404);
        }
        AdminDataScope::authorizeCreatedBy($ticket->program, $request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'price' => ['required', 'integer', 'min:0'],
            'quota' => ['nullable', 'integer', 'min:0'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $ticket->update([
            'name' => $data['name'],
            'price' => $data['price'],
            'capacity' => $data['quota'],
            'sort_order' => $data['sort_order'] ?? $ticket->sort_order,
        ]);

        return back();
    }

    public function store(Request $request): RedirectResponse
    {
        $programRule = Rule::exists('special_programs', 'id');
        if (! AdminDataScope::canViewAll($request->user())) {
            $programRule = $programRule->where('created_by', $request->user()?->id ?? 0);
        }

        $data = $request->validate([
            'program_id' => ['required', $programRule],
            'name' => ['required', 'string', 'max:255'],
            'price' => ['required', 'integer', 'min:0'],
            'quota' => ['nullable', 'integer', 'min:0'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $program = SpecialProgram::query()
            ->where('id', $data['program_id'])
            ->firstOrFail();

        SpecialProgramVariant::create([
            'special_program_id' => $program->id,
            'name' => $data['name'],
            'price' => $data['price'],
            'capacity' => $data['quota'],
            'sort_order' => $data['sort_order'] ?? 0,
        ]);

        return back()->with('status', 'special-program-ticket-created');
    }

    public function destroy(SpecialProgramVariant $ticket): RedirectResponse
    {
        $ticket->loadMissing('program');
        if (! $ticket->program) {
            abort(404);
        }
        AdminDataScope::authorizeCreatedBy($ticket->program, request());

        $ticket->delete();

        return back()->with('status', 'special-program-ticket-deleted');
    }
}
