<?php

namespace App\Http\Controllers\Mitra;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Hotel;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OccupancyController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $month = $request->input('month', now()->format('Y-m'));
        $selectedHotelId = $request->input('hotel_id');

        $hotelQuery = Hotel::query()->where('vendor_id', $user->id);
        $hotelOptions = $hotelQuery
            ->orderBy('name')
            ->get()
            ->map(fn (Hotel $hotel) => [
                'id' => $hotel->id,
                'label' => $hotel->name,
            ])
            ->all();

        $hotel = null;
        if ($selectedHotelId) {
            $hotel = $hotelQuery->where('id', (int) $selectedHotelId)->first();
        }
        if (! $hotel) {
            $hotel = $hotelQuery->first();
        }

        $start = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
        $end = $start->copy()->endOfMonth();

        $days = [];
        foreach (CarbonPeriod::create($start, $end) as $date) {
            $key = $date->toDateString();
            $days[$key] = [
                'date' => $key,
                'rooms_sold' => 0,
            ];
        }

        $totalRooms = 0;
        if ($hotel) {
            $totalRooms = (int) $hotel->roomTypes()->sum('total_rooms');

            $bookings = Booking::query()
                ->where('hotel_id', $hotel->id)
                ->whereIn('status', ['paid', 'completed'])
                ->whereDate('check_out', '>', $start)
                ->whereDate('check_in', '<=', $end)
                ->get(['check_in', 'check_out', 'rooms_count']);

            foreach ($bookings as $booking) {
                $period = CarbonPeriod::create($booking->check_in, $booking->check_out->copy()->subDay());
                foreach ($period as $date) {
                    $key = $date->toDateString();
                    if (isset($days[$key])) {
                        $days[$key]['rooms_sold'] += (int) $booking->rooms_count;
                    }
                }
            }
        }

        $occupancy = array_values(array_map(function ($day) use ($totalRooms) {
            $rate = $totalRooms > 0 ? round(($day['rooms_sold'] / $totalRooms) * 100) : 0;
            return [
                'date' => $day['date'],
                'rooms_sold' => $day['rooms_sold'],
                'rooms_total' => $totalRooms,
                'occupancy_rate' => $rate,
            ];
        }, $days));

        return Inertia::render('mitra/occupancy/index', [
            'hotelOptions' => $hotelOptions,
            'selectedHotelId' => $hotel?->id,
            'month' => $start->format('Y-m'),
            'occupancy' => $occupancy,
        ]);
    }
}
