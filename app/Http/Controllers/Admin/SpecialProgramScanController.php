<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SpecialProgram;
use App\Models\SpecialProgramAttendee;
use App\Models\SpecialProgramBooking;
use App\Models\SpecialProgramScan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SpecialProgramScanController extends Controller
{
    public function index(Request $request): Response
    {
        $programId = $request->integer('program_id');
        $date = $request->string('date')->toString();
        $query = SpecialProgramScan::query()
            ->with(['booking.program', 'booking.variant'])
            ->latest('scanned_at');
        if ($programId) {
            $query->whereHas('booking', fn ($q) => $q->where('special_program_id', $programId));
        }
        if ($date) {
            $query->whereDate('scanned_at', $date);
        }

        return Inertia::render('admin/special-programs/scans/index', [
            'scans' => $query->paginate(\App\Support\PaginationOptions::perPage())->withQueryString(),
            'programs' => SpecialProgram::query()
                ->select('id', 'name')
                ->orderBy('name')
                ->get(),
            'filters' => [
                'program_id' => $programId ?: null,
                'date' => $date,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'booking_code' => ['required', 'string', 'max:255'],
            'officer_name' => ['nullable', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
        ]);

        $code = $this->normalizeCode($data['booking_code']);
        $booking = SpecialProgramBooking::query()
            ->with(['program', 'variant'])
            ->where(function ($query) use ($code) {
                $query->where('midtrans_order_id', $code);
                if (ctype_digit($code)) {
                    $query->orWhere('id', (int) $code);
                }
            })
            ->first();

        if (! $booking) {
            return back()->withErrors([
                'booking_code' => 'Kode booking special program tidak ditemukan.',
            ]);
        }

        if (! in_array($booking->status, ['paid', 'completed'], true)) {
            return back()->withErrors([
                'booking_code' => 'Booking belum dibayar atau tidak valid.',
            ]);
        }

        $existingScan = SpecialProgramScan::query()
            ->where('special_program_booking_id', $booking->id)
            ->latest('scanned_at')
            ->first();

        $scan = SpecialProgramScan::create([
            'special_program_booking_id' => $booking->id,
            'special_program_variant_id' => $booking->special_program_variant_id,
            'scanned_at' => now(),
            'officer_name' => $data['officer_name'] ?? null,
            'location' => $data['location'] ?? null,
            'is_anomaly' => (bool) $existingScan,
        ]);

        $updatedAttendees = SpecialProgramAttendee::query()
            ->where('special_program_booking_id', $booking->id)
            ->update([
                'attendance_status' => 'present',
                'checked_in_at' => now(),
            ]);

        if ($updatedAttendees === 0) {
            $quantity = max(1, (int) $booking->quantity);
            for ($index = 1; $index <= $quantity; $index++) {
                SpecialProgramAttendee::create([
                    'special_program_booking_id' => $booking->id,
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

    private function normalizeCode(string $value): string
    {
        $parts = collect(explode('|', trim($value)))
            ->map(fn (string $part) => trim($part))
            ->filter()
            ->values();

        return $parts->isNotEmpty() ? (string) $parts->last() : trim($value);
    }
}
