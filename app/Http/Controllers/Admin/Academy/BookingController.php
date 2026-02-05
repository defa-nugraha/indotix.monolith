<?php

namespace App\Http\Controllers\Admin\Academy;

use App\Http\Controllers\Controller;
use App\Models\AcademyBooking;
use App\Models\AcademyClass;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BookingController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->string('status')->toString();
        $classId = $request->integer('class_id');
        $date = $request->string('date')->toString();

        $query = AcademyBooking::query()->with(['academyClass', 'ticket', 'user'])->latest('id');
        if ($status) {
            $query->where('status', $status);
        }
        if ($classId) {
            $query->where('academy_class_id', $classId);
        }
        if ($date) {
            $query->whereDate('created_at', $date);
        }

        return Inertia::render('admin/academy/bookings/index', [
            'bookings' => $query->paginate(20)->withQueryString(),
            'classes' => AcademyClass::query()->select('id', 'title')->orderBy('title')->get(),
            'filters' => [
                'status' => $status,
                'class_id' => $classId ?: null,
                'date' => $date,
            ],
        ]);
    }

    public function show(AcademyBooking $booking): Response
    {
        $booking->load(['academyClass', 'ticket', 'user', 'attendees', 'scans']);

        return Inertia::render('admin/academy/bookings/show', [
            'booking' => $booking,
        ]);
    }
}
