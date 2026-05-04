<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SpecialProgram;
use App\Models\SpecialProgramVariant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SpecialProgramTicketController extends Controller
{
    public function index(Request $request): Response
    {
        $programId = $request->integer('program_id');
        $query = SpecialProgramVariant::query()
            ->with('program')
            ->latest();
        if ($programId) {
            $query->where('special_program_id', $programId);
        }

        return Inertia::render('admin/special-programs/tickets/index', [
            'tickets' => $query->paginate(20)->withQueryString(),
            'programs' => SpecialProgram::query()
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
        $data = $request->validate([
            'program_id' => ['required', 'exists:special_programs,id'],
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
        $ticket->delete();

        return back()->with('status', 'special-program-ticket-deleted');
    }
}
