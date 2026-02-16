<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademyBooking;
use App\Models\Booking;
use App\Models\EventBooking;
use App\Models\MitraEventOnboarding;
use App\Models\MitraOnboarding;
use App\Models\MitraWisataOnboarding;
use App\Models\SouvenirOrder;
use App\Models\WisataBooking;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $today = now()->toDateString();
        $monthStart = now()->startOfMonth()->toDateString();
        $monthEnd = now()->endOfMonth()->toDateString();

        $hotelBookingsToday = Booking::query()
            ->whereDate('created_at', $today)
            ->whereIn('status', ['paid', 'completed'])
            ->count();
        $hotelRoomsSoldToday = (int) Booking::query()
            ->whereDate('created_at', $today)
            ->whereIn('status', ['paid', 'completed'])
            ->sum('rooms_count');

        $wisataBookingsToday = WisataBooking::query()
            ->whereDate('created_at', $today)
            ->whereIn('status', ['paid', 'completed'])
            ->count();
        $wisataTicketsSoldToday = (int) WisataBooking::query()
            ->whereDate('created_at', $today)
            ->whereIn('status', ['paid', 'completed'])
            ->sum('quantity');

        $eventBookingsToday = EventBooking::query()
            ->whereDate('created_at', $today)
            ->whereIn('status', ['paid', 'completed'])
            ->count();
        $eventTicketsSoldToday = (int) EventBooking::query()
            ->whereDate('created_at', $today)
            ->whereIn('status', ['paid', 'completed'])
            ->sum('quantity');

        $academyBookingsToday = AcademyBooking::query()
            ->whereDate('created_at', $today)
            ->whereIn('status', ['paid', 'completed'])
            ->count();
        $academyTicketsSoldToday = (int) AcademyBooking::query()
            ->whereDate('created_at', $today)
            ->whereIn('status', ['paid', 'completed'])
            ->sum('quantity');

        $souvenirOrdersToday = SouvenirOrder::query()
            ->whereDate('created_at', $today)
            ->whereIn('status', ['paid', 'completed'])
            ->count();

        $transactionsToday = $hotelBookingsToday
            + $wisataBookingsToday
            + $eventBookingsToday
            + $academyBookingsToday
            + $souvenirOrdersToday;
        $ticketsSoldToday = $hotelRoomsSoldToday
            + $wisataTicketsSoldToday
            + $eventTicketsSoldToday
            + $academyTicketsSoldToday;

        $activePartners = MitraOnboarding::query()
            ->where('verification_status', 'verified')
            ->count()
            + MitraWisataOnboarding::query()
                ->where('verification_status', 'verified')
                ->where('is_suspended', false)
                ->count()
            + MitraEventOnboarding::query()
                ->where('verification_status', 'verified')
                ->count();

        $pendingReviews = MitraOnboarding::query()
            ->where('verification_status', 'pending')
            ->count()
            + MitraWisataOnboarding::query()
                ->where('verification_status', 'pending')
                ->count()
            + MitraEventOnboarding::query()
                ->where('verification_status', 'pending')
                ->count();

        $pendingPayouts = MitraOnboarding::query()
            ->where('payout_status', 'pending')
            ->count()
            + MitraWisataOnboarding::query()
                ->where('payout_status', 'pending')
                ->count();

        $pendingPayments = Booking::query()->where('status', 'pending_payment')->count()
            + WisataBooking::query()->where('status', 'pending_payment')->count()
            + EventBooking::query()->where('status', 'pending_payment')->count()
            + AcademyBooking::query()->where('status', 'pending_payment')->count()
            + SouvenirOrder::query()->where('status', 'pending_payment')->count();

        $activities = collect();

        $latestHotel = Booking::query()->with('hotel')->latest('created_at')->first();
        if ($latestHotel) {
            $activities->push([
                'title' => 'Booking hotel '.($latestHotel->hotel?->name ?? 'baru'),
                'meta' => $latestHotel->rooms_count.' kamar • '.$latestHotel->created_at->diffForHumans(),
                'created_at' => $latestHotel->created_at?->timestamp ?? 0,
            ]);
        }

        $latestWisata = WisataBooking::query()->with('destination')->latest('created_at')->first();
        if ($latestWisata) {
            $activities->push([
                'title' => 'Tiket wisata '.($latestWisata->destination?->destination_name ?? 'baru'),
                'meta' => $latestWisata->quantity.' tiket • '.$latestWisata->created_at->diffForHumans(),
                'created_at' => $latestWisata->created_at?->timestamp ?? 0,
            ]);
        }

        $latestEvent = EventBooking::query()->with('event')->latest('created_at')->first();
        if ($latestEvent) {
            $activities->push([
                'title' => 'Booking event '.($latestEvent->event?->title ?? 'baru'),
                'meta' => $latestEvent->quantity.' tiket • '.$latestEvent->created_at->diffForHumans(),
                'created_at' => $latestEvent->created_at?->timestamp ?? 0,
            ]);
        }

        $latestAcademy = AcademyBooking::query()->with('academyClass')->latest('created_at')->first();
        if ($latestAcademy) {
            $activities->push([
                'title' => 'Kelas Academy '.($latestAcademy->academyClass?->title ?? 'baru'),
                'meta' => $latestAcademy->quantity.' tiket • '.$latestAcademy->created_at->diffForHumans(),
                'created_at' => $latestAcademy->created_at?->timestamp ?? 0,
            ]);
        }

        $latestSouvenir = SouvenirOrder::query()->latest('created_at')->first();
        if ($latestSouvenir) {
            $activities->push([
                'title' => 'Order souvenir baru',
                'meta' => 'Order #'.$latestSouvenir->id.' • '.$latestSouvenir->created_at->diffForHumans(),
                'created_at' => $latestSouvenir->created_at?->timestamp ?? 0,
            ]);
        }

        $activities = $activities->sortByDesc('created_at')->take(4)->values()->all();

        return Inertia::render('dashboard', [
            'summary' => [
                'transactions_today' => $transactionsToday,
                'tickets_sold' => $ticketsSoldToday,
                'active_partners' => $activePartners,
            ],
            'system' => [
                'pending_reviews' => $pendingReviews,
                'pending_payouts' => $pendingPayouts,
                'pending_payments' => $pendingPayments,
            ],
            'activities' => $activities,
        ]);
    }
}
