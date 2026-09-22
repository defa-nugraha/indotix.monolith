<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MitraWisataOnboarding;
use App\Models\WisataBooking;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $today = now()->toDateString();

        $wisataBookingsToday = WisataBooking::query()
            ->whereDate('created_at', $today)
            ->whereIn('status', ['paid', 'completed'])
            ->count();
        $wisataTicketsSoldToday = (int) WisataBooking::query()
            ->whereDate('created_at', $today)
            ->whereIn('status', ['paid', 'completed'])
            ->sum('quantity');

        $latestWisata = WisataBooking::query()
            ->with('destination')
            ->latest('created_at')
            ->first();

        $activities = $latestWisata ? [[
            'title' => 'Tiket wisata '.($latestWisata->destination?->destination_name ?? 'baru'),
            'meta' => $latestWisata->quantity.' tiket • '.$latestWisata->created_at->diffForHumans(),
            'created_at' => $latestWisata->created_at?->timestamp ?? 0,
        ]] : [];

        return Inertia::render('dashboard', [
            'scope' => 'admin',
            'summary' => [
                'transactions_today' => $wisataBookingsToday,
                'tickets_sold' => $wisataTicketsSoldToday,
                'active_partners' => MitraWisataOnboarding::query()
                    ->where('verification_status', 'verified')
                    ->where('is_suspended', false)
                    ->count(),
            ],
            'system' => [
                'pending_reviews' => MitraWisataOnboarding::query()
                    ->where('verification_status', 'pending')
                    ->count(),
                'pending_payouts' => MitraWisataOnboarding::query()
                    ->where('payout_status', 'pending')
                    ->count(),
                'pending_payments' => WisataBooking::query()
                    ->where('status', 'pending_payment')
                    ->count(),
            ],
            'activities' => $activities,
        ]);
    }
}
