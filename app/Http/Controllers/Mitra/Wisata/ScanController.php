<?php

namespace App\Http\Controllers\Mitra\Wisata;

use App\Http\Controllers\Controller;
use App\Models\MitraWisataOnboarding;
use App\Models\WisataBooking;
use App\Models\WisataTicketScan;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ScanController extends Controller
{
    public function index(Request $request): Response
    {
        $destination = MitraWisataOnboarding::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $query = WisataTicketScan::query()
            ->with(['booking.ticket'])
            ->whereHas('booking', fn ($builder) => $builder->where('mitra_wisata_onboarding_id', $destination->id));

        if ($date = $request->string('date')->toString()) {
            $query->whereDate('scanned_at', $date);
        }

        $scans = $query->latest('scanned_at')
            ->paginate(\App\Support\PaginationOptions::perPage())
            ->withQueryString()
            ->through(fn (WisataTicketScan $scan) => [
                'id' => $scan->id,
                'scanned_at' => $scan->scanned_at?->format('Y-m-d H:i'),
                'officer_name' => $scan->officer_name,
                'location' => $scan->location,
                'is_anomaly' => $scan->is_anomaly,
                'booking' => [
                    'id' => $scan->booking?->id,
                    'booking_code' => $scan->booking?->booking_code,
                    'visit_date' => $scan->booking?->visit_date?->toDateString(),
                    'ticket_name' => $scan->booking?->ticket?->name,
                ],
            ]);

        return Inertia::render('mitra/wisata/scans/index', [
            'destination' => [
                'id' => $destination->id,
                'destination_name' => $destination->destination_name,
            ],
            'scans' => $scans,
            'filters' => [
                'date' => $request->string('date')->toString(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $destination = MitraWisataOnboarding::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $data = $request->validate([
            'booking_code' => ['required', 'string', 'max:255'],
            'officer_name' => ['nullable', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
        ]);

        $booking = WisataBooking::query()
            ->where('mitra_wisata_onboarding_id', $destination->id)
            ->where('booking_code', $data['booking_code'])
            ->first();

        if (! $booking) {
            return back()->withErrors([
                'booking_code' => 'Kode booking tidak ditemukan.',
            ]);
        }

        $hasScan = WisataTicketScan::query()
            ->where('wisata_booking_id', $booking->id)
            ->exists();

        WisataTicketScan::create([
            'wisata_booking_id' => $booking->id,
            'scanned_at' => Carbon::now(),
            'officer_name' => $data['officer_name'] ?? null,
            'location' => $data['location'] ?? null,
            'is_anomaly' => $hasScan,
        ]);

        if ($booking->status === 'paid') {
            $booking->update(['status' => 'completed']);
        }

        return back()->with('status', 'scan-recorded');
    }
}
