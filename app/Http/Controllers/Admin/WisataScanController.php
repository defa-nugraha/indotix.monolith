<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\WisataTicketScan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WisataScanController extends Controller
{
    public function index(Request $request): Response
    {
        $query = WisataTicketScan::query()
            ->with(['booking.destination', 'booking.ticket']);

        if ($destination = $request->string('destination')->toString()) {
            $query->whereHas('booking', function ($builder) use ($destination) {
                $builder->where('mitra_wisata_onboarding_id', $destination);
            });
        }

        if ($anomaly = $request->string('anomaly')->toString()) {
            $query->where('is_anomaly', $anomaly === 'yes');
        }

        $doubleScanBookingIds = \App\Models\WisataTicketScan::query()
            ->select('wisata_booking_id')
            ->groupBy('wisata_booking_id')
            ->havingRaw('COUNT(*) > 1')
            ->pluck('wisata_booking_id')
            ->all();

        $scans = $query->latest('scanned_at')
            ->paginate(10)
            ->withQueryString()
            ->through(function (WisataTicketScan $scan) {
                $isDouble = in_array($scan->wisata_booking_id, $doubleScanBookingIds, true);
                return [
                    'id' => $scan->id,
                    'scanned_at' => $scan->scanned_at?->toDateTimeString(),
                    'officer_name' => $scan->officer_name,
                    'location' => $scan->location,
                    'is_anomaly' => $scan->is_anomaly || $isDouble,
                    'booking' => [
                        'id' => $scan->booking?->id,
                        'booking_code' => $scan->booking?->booking_code,
                    ],
                    'destination' => [
                        'id' => $scan->booking?->destination?->id,
                        'name' => $scan->booking?->destination?->destination_name,
                    ],
                    'ticket' => [
                        'id' => $scan->booking?->ticket?->id,
                        'name' => $scan->booking?->ticket?->name,
                    ],
                ];
            });

        $destinations = \App\Models\MitraWisataOnboarding::query()
            ->orderBy('destination_name')
            ->get(['id', 'destination_name'])
            ->map(fn ($item) => ['id' => $item->id, 'label' => $item->destination_name ?? 'Destinasi #' . $item->id])
            ->all();

        return Inertia::render('admin/wisata/scans/index', [
            'scans' => $scans,
            'destinations' => $destinations,
            'filters' => [
                'destination' => $request->string('destination')->toString(),
                'anomaly' => $request->string('anomaly')->toString(),
            ],
        ]);
    }
}
