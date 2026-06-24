<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MitraWisataOnboarding;
use App\Models\Regency;
use App\Models\WisataBooking;
use App\Support\AdminDataScope;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WisataBookingController extends Controller
{
    public function index(Request $request): Response
    {
        $query = WisataBooking::query()
            ->with(['destination', 'ticket', 'user:id,name,email'])
            ->whereHas('destination', fn ($builder) => AdminDataScope::applyCreatedByOrUser($builder, $request));

        if ($date = $request->string('visit_date')->toString()) {
            $query->whereDate('visit_date', $date);
        }

        if ($destination = $request->string('destination')->toString()) {
            $query->where('mitra_wisata_onboarding_id', $destination);
        }

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        $bookings = $query->latest('id')
            ->paginate(\App\Support\PaginationOptions::perPage())
            ->withQueryString()
            ->through(function (WisataBooking $booking) {
                return [
                    'id' => $booking->id,
                    'booking_code' => $booking->booking_code,
                    'visit_date' => $booking->visit_date?->toDateString(),
                    'status' => $booking->status,
                    'quantity' => $booking->quantity,
                    'total_price' => $booking->total_price,
                    'destination' => [
                        'id' => $booking->destination?->id,
                        'destination_name' => $booking->destination?->destination_name,
                        'city_code' => $booking->destination?->city_code,
                    ],
                    'ticket' => [
                        'id' => $booking->ticket?->id,
                        'name' => $booking->ticket?->name,
                    ],
                    'user' => [
                        'id' => $booking->user?->id,
                        'name' => $booking->user?->name,
                        'email' => $booking->user?->email,
                    ],
                ];
            });

        $destinations = AdminDataScope::applyCreatedByOrUser(MitraWisataOnboarding::query(), $request)
            ->orderBy('destination_name')
            ->get(['id', 'destination_name'])
            ->map(fn ($item) => ['id' => $item->id, 'label' => $item->destination_name ?? 'Destinasi #' . $item->id])
            ->all();

        $cities = Regency::query()
            ->orderBy('name')
            ->get(['code', 'name'])
            ->map(fn ($item) => ['id' => $item->code, 'label' => $item->name])
            ->all();

        return Inertia::render('admin/wisata/bookings/index', [
            'bookings' => $bookings,
            'destinations' => $destinations,
            'cities' => $cities,
            'filters' => [
                'visit_date' => $request->string('visit_date')->toString(),
                'destination' => $request->string('destination')->toString(),
                'status' => $request->string('status')->toString(),
            ],
        ]);
    }

    public function show(WisataBooking $booking): Response
    {
        $booking->load(['destination', 'ticket', 'user:id,name,email', 'scans']);
        if ($booking->destination) {
            AdminDataScope::authorizeCreatedByOrUser($booking->destination, request());
        }

        $cityName = Regency::query()
            ->where('code', $booking->destination?->city_code)
            ->value('name');

        return Inertia::render('admin/wisata/bookings/show', [
            'booking' => $booking,
            'cityName' => $cityName,
        ]);
    }
}
