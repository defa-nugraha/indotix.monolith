<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SpecialProgram;
use App\Models\SpecialProgramAttendee;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SpecialProgramAttendeeController extends Controller
{
    public function index(Request $request): Response
    {
        $programId = $request->integer('program_id');
        $status = $request->string('status')->toString();
        $query = SpecialProgramAttendee::query()
            ->with(['booking.program', 'booking.variant'])
            ->latest();
        if ($programId) {
            $query->whereHas('booking', fn ($q) => $q->where('special_program_id', $programId));
        }
        if ($status) {
            $query->where('attendance_status', $status);
        }

        return Inertia::render('admin/special-programs/attendees/index', [
            'attendees' => $query->paginate(\App\Support\PaginationOptions::perPage())->withQueryString(),
            'programs' => SpecialProgram::query()
                ->select('id', 'name')
                ->orderBy('name')
                ->get(),
            'filters' => [
                'program_id' => $programId ?: null,
                'status' => $status,
            ],
        ]);
    }
}
