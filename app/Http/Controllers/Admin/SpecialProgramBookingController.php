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

        $bookings = $query->paginate(\App\Support\PaginationOptions::perPage())
            ->withQueryString()
            ->through(function (SpecialProgramBooking $booking) {
                return [
                    'id' => $booking->id,
                    'status' => $booking->status,
                    'quantity' => $booking->quantity,
                    'visit_date' => $booking->visit_date?->toDateString(),
                    'guest_name' => $booking->guest_name,
                    'guest_phone' => $booking->guest_phone,
                    'program' => [
                        'name' => $booking->program?->name,
                    ],
                    'variant' => [
                        'name' => $booking->variant?->name,
                    ],
                    'user' => [
                        'name' => $booking->user?->name,
                    ],
                ];
            });

        return Inertia::render('admin/special-programs/bookings/index', [
            'bookings' => $bookings,
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
            'booking' => [
                'id' => $booking->id,
                'status' => $booking->status,
                'payment_status' => $booking->payment_status,
                'quantity' => $booking->quantity,
                'visit_date' => $booking->visit_date?->toDateString(),
                'unit_price' => $booking->unit_price,
                'total_price' => $booking->total_price,
                'notes' => $booking->notes,
                'guest_name' => $booking->guest_name,
                'guest_email' => $booking->guest_email,
                'guest_phone' => $booking->guest_phone,
                'program' => [
                    'name' => $booking->program?->name,
                ],
                'variant' => [
                    'name' => $booking->variant?->name,
                ],
                'user' => [
                    'name' => $booking->user?->name,
                ],
            ],
        ]);
    }

    public function updateStatus(Request $request, SpecialProgramBooking $booking): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:pending_payment,paid,completed,cancelled,expired'],
        ]);

        $booking->update([
            'status' => $data['status'],
        ]);

        return back();
    }
}
