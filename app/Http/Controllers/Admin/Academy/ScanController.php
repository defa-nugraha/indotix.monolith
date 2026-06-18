<?php

namespace App\Http\Controllers\Admin\Academy;

use App\Http\Controllers\Controller;
use App\Models\AcademyAttendee;
use App\Models\AcademyBooking;
use App\Models\AcademyClass;
use App\Models\AcademyScan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ScanController extends Controller
{
    public function index(Request $request): Response
    {
        $classId = $request->integer('class_id');
        $date = $request->string('date')->toString();

        $query = AcademyScan::query()->with(['booking.academyClass', 'ticket'])->latest('scanned_at');
        if ($classId) {
            $query->whereHas('booking', fn ($q) => $q->where('academy_class_id', $classId));
        }
        if ($date) {
            $query->whereDate('scanned_at', $date);
        }

        return Inertia::render('admin/academy/scans/index', [
            'scans' => $query->paginate(\App\Support\PaginationOptions::perPage())->withQueryString(),
            'classes' => AcademyClass::query()->select('id', 'title')->orderBy('title')->get(),
            'filters' => [
                'class_id' => $classId ?: null,
                'date' => $date,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'booking_code' => ['required', 'string', 'max:255'],
            'officer_name' => ['nullable', 'string', 'max:255'],
            'device' => ['nullable', 'string', 'max:255'],
        ]);

        $booking = AcademyBooking::query()
            ->where('booking_code', $data['booking_code'])
            ->with(['academyClass', 'ticket'])
            ->first();

        if (! $booking) {
            return back()->withErrors([
                'booking_code' => 'Kode booking academy tidak ditemukan.',
            ]);
        }

        if (! in_array($booking->status, ['paid', 'completed'], true)) {
            return back()->withErrors([
                'booking_code' => 'Booking belum dibayar atau tidak valid.',
            ]);
        }

        $existingScan = AcademyScan::query()
            ->where('academy_booking_id', $booking->id)
            ->latest('scanned_at')
            ->first();

        $scan = AcademyScan::create([
            'academy_booking_id' => $booking->id,
            'academy_ticket_id' => $booking->academy_ticket_id,
            'scanned_at' => now(),
            'officer_name' => $data['officer_name'] ?? null,
            'device' => $data['device'] ?? null,
            'is_anomaly' => (bool) $existingScan,
        ]);

        $updatedAttendees = AcademyAttendee::query()
            ->where('academy_booking_id', $booking->id)
            ->update([
                'attendance_status' => 'present',
                'checked_in_at' => now(),
            ]);

        if ($updatedAttendees === 0) {
            $quantity = max(1, (int) $booking->quantity);
            for ($index = 1; $index <= $quantity; $index++) {
                AcademyAttendee::create([
                    'academy_booking_id' => $booking->id,
                    'name' => $quantity > 1 ? "{$booking->guest_name} #{$index}" : $booking->guest_name,
                    'email' => $booking->guest_email,
                    'phone' => $booking->guest_phone,
                    'attendance_status' => 'present',
                    'checked_in_at' => now(),
                ]);
            }
        }

        if ($booking->status === 'paid') {
            $booking->update(['status' => 'completed']);
        }

        return back()->with('status', $scan->is_anomaly ? 'scan-anomaly' : 'scan-success');
    }
}
