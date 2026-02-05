<?php

namespace App\Http\Controllers\Admin\Academy;

use App\Http\Controllers\Controller;
use App\Models\AcademyAttendee;
use App\Models\AcademyClass;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AttendeeController extends Controller
{
    public function index(Request $request): Response
    {
        $classId = $request->integer('class_id');
        $checkedIn = $request->string('checked_in')->toString();

        $query = AcademyAttendee::query()->with(['booking.academyClass', 'booking.ticket'])->latest('id');
        if ($classId) {
            $query->whereHas('booking', fn ($q) => $q->where('academy_class_id', $classId));
        }
        if ($checkedIn !== '') {
            $query->where('attendance_status', $checkedIn === 'yes' ? 'present' : 'absent');
        }

        return Inertia::render('admin/academy/attendees/index', [
            'attendees' => $query->paginate(20)->withQueryString(),
            'classes' => AcademyClass::query()->select('id', 'title')->orderBy('title')->get(),
            'filters' => [
                'class_id' => $classId ?: null,
                'checked_in' => $checkedIn,
            ],
        ]);
    }
}
