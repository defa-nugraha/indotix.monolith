<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SpecialProgram;
use App\Models\SpecialProgramBooking;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SpecialProgramBookingController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->string('status')->toString();
        $programId = $request->integer('program_id');
        $date = $request->string('date')->toString();

        $query = SpecialProgramBooking::query()
            ->with(['program', 'variant', 'user'])
            ->latest();
        if ($status) {
            $query->where('status', $status);
        }
        if ($programId) {
            $query->where('special_program_id', $programId);
        }
        if ($date) {
            $query->whereDate('visit_date', $date);
        }

        return Inertia::render('admin/special-programs/bookings/index', [
            'bookings' => $query->paginate(20)->withQueryString(),
            'programs' => SpecialProgram::query()
                ->select('id', 'name')
                ->orderBy('name')
                ->get(),
            'filters' => [
                'status' => $status,
                'program_id' => $programId ?: null,
                'date' => $date,
            ],
        ]);
    }

    public function show(SpecialProgramBooking $booking): Response
    {
        $booking->load(['program', 'variant', 'user']);

        return Inertia::render('admin/special-programs/bookings/show', [
            'booking' => $booking,
        ]);
    }

    public function updateStatus(Request $request, SpecialProgramBooking $booking): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:pending,confirmed,cancelled'],
        ]);

        $booking->update([
            'status' => $data['status'],
        ]);

        return back();
    }
}
