<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademyBooking;
use App\Models\AcademyClass;
use App\Models\AcademyRefund;
use App\Models\Booking;
use App\Models\Event;
use App\Models\EventBooking;
use App\Models\MitraEventOnboarding;
use App\Models\MitraOnboarding;
use App\Models\MitraWisataOnboarding;
use App\Models\SouvenirOrder;
use App\Models\SouvenirOrderItem;
use App\Models\SouvenirProduct;
use App\Models\SouvenirRefund;
use App\Models\WisataBooking;
use App\Support\AdminPermissionRegistry;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = request()->user();
        $role = $user?->role ?? 'admin';
        $scope = match ($role) {
            'admin_academy' => 'academy',
            'admin_retail' => 'retail',
            'admin_special_program' => 'special',
            'admin_custom' => 'custom',
            default => 'admin',
        };
        $permissionKeys = AdminPermissionRegistry::permissionKeysForUser($user);
        $hasPermissionPrefix = function (array $prefixes) use ($role, $permissionKeys): bool {
            if ($role === 'admin') {
                return true;
            }

            foreach ($permissionKeys as $permissionKey) {
                foreach ($prefixes as $prefix) {
                    if (str_starts_with($permissionKey, $prefix)) {
                        return true;
                    }
                }
            }

            return false;
        };
        $canSeeHotel = $hasPermissionPrefix(['hotel_', 'mitra.']);
        $canSeeWisata = $hasPermissionPrefix(['wisata_', 'mitra_wisata.']);
        $canSeeEvent = $hasPermissionPrefix(['events_', 'mitra_events.']);
        $canSeeAcademy = $scope === 'academy' || $hasPermissionPrefix(['academy_']);
        $canSeeRetail = $scope === 'retail' || $hasPermissionPrefix(['retail_']);
        $canSeeSpecial = $scope === 'special' || $hasPermissionPrefix(['special_program_']);

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
            ->whereHas('event', fn ($q) => $q->where('event_type', 'event'))
            ->whereDate('created_at', $today)
            ->whereIn('status', ['paid', 'completed'])
            ->count();
        $eventTicketsSoldToday = (int) EventBooking::query()
            ->whereHas('event', fn ($q) => $q->where('event_type', 'event'))
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

        $souvenirItemsSoldToday = (int) SouvenirOrderItem::query()
            ->whereHas('order', function ($query) use ($today) {
                $query->whereDate('created_at', $today)
                    ->whereIn('status', ['paid', 'completed']);
            })
            ->sum('quantity');

        $specialProgramBookingsToday = EventBooking::query()
            ->whereHas('event', fn ($q) => $q->where('event_type', 'special_program'))
            ->whereDate('created_at', $today)
            ->whereIn('status', ['paid', 'completed'])
            ->count();
        $specialProgramTicketsSoldToday = (int) EventBooking::query()
            ->whereHas('event', fn ($q) => $q->where('event_type', 'special_program'))
            ->whereDate('created_at', $today)
            ->whereIn('status', ['paid', 'completed'])
            ->sum('quantity');

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
            + EventBooking::query()
                ->whereHas('event', fn ($q) => $q->where('event_type', 'event'))
                ->where('status', 'pending_payment')
                ->count()
            + AcademyBooking::query()->where('status', 'pending_payment')->count()
            + SouvenirOrder::query()->where('status', 'pending_payment')->count();

        $activities = collect();

        if ($scope === 'academy') {
            $latestAcademy = AcademyBooking::query()->with('academyClass')->latest('created_at')->first();
            if ($latestAcademy) {
                $activities->push([
                    'title' => 'Booking kelas '.($latestAcademy->academyClass?->title ?? 'baru'),
                    'meta' => $latestAcademy->quantity.' tiket • '.$latestAcademy->created_at->diffForHumans(),
                    'created_at' => $latestAcademy->created_at?->timestamp ?? 0,
                ]);
            }
        } elseif ($scope === 'retail') {
            $latestSouvenir = SouvenirOrder::query()->latest('created_at')->first();
            if ($latestSouvenir) {
                $activities->push([
                    'title' => 'Order retail shop baru',
                    'meta' => 'Order #'.$latestSouvenir->id.' • '.$latestSouvenir->created_at->diffForHumans(),
                    'created_at' => $latestSouvenir->created_at?->timestamp ?? 0,
                ]);
            }
        } elseif ($scope === 'special') {
            $latestSpecial = EventBooking::query()
                ->whereHas('event', fn ($q) => $q->where('event_type', 'special_program'))
                ->with('event')
                ->latest('created_at')
                ->first();
            if ($latestSpecial) {
                $activities->push([
                    'title' => 'Booking special program '.($latestSpecial->event?->title ?? 'baru'),
                    'meta' => $latestSpecial->quantity.' tiket • '.$latestSpecial->created_at->diffForHumans(),
                    'created_at' => $latestSpecial->created_at?->timestamp ?? 0,
                ]);
            }
        } else {
            $latestHotel = $canSeeHotel ? Booking::query()->with('hotel')->latest('created_at')->first() : null;
            if ($latestHotel) {
                $activities->push([
                    'title' => 'Booking hotel '.($latestHotel->hotel?->name ?? 'baru'),
                    'meta' => $latestHotel->rooms_count.' kamar • '.$latestHotel->created_at->diffForHumans(),
                    'created_at' => $latestHotel->created_at?->timestamp ?? 0,
                ]);
            }

            $latestWisata = $canSeeWisata ? WisataBooking::query()->with('destination')->latest('created_at')->first() : null;
            if ($latestWisata) {
                $activities->push([
                    'title' => 'Tiket wisata '.($latestWisata->destination?->destination_name ?? 'baru'),
                    'meta' => $latestWisata->quantity.' tiket • '.$latestWisata->created_at->diffForHumans(),
                    'created_at' => $latestWisata->created_at?->timestamp ?? 0,
                ]);
            }

            $latestEvent = $canSeeEvent ? EventBooking::query()
                ->whereHas('event', fn ($q) => $q->where('event_type', 'event'))
                ->with('event')
                ->latest('created_at')
                ->first() : null;
            if ($latestEvent) {
                $activities->push([
                    'title' => 'Booking event '.($latestEvent->event?->title ?? 'baru'),
                    'meta' => $latestEvent->quantity.' tiket • '.$latestEvent->created_at->diffForHumans(),
                    'created_at' => $latestEvent->created_at?->timestamp ?? 0,
                ]);
            }

            $latestAcademy = $canSeeAcademy ? AcademyBooking::query()->with('academyClass')->latest('created_at')->first() : null;
            if ($latestAcademy) {
                $activities->push([
                    'title' => 'Kelas Academy '.($latestAcademy->academyClass?->title ?? 'baru'),
                    'meta' => $latestAcademy->quantity.' tiket • '.$latestAcademy->created_at->diffForHumans(),
                    'created_at' => $latestAcademy->created_at?->timestamp ?? 0,
                ]);
            }

            $latestSouvenir = $canSeeRetail ? SouvenirOrder::query()->latest('created_at')->first() : null;
            if ($latestSouvenir) {
                $activities->push([
                    'title' => 'Order souvenir baru',
                    'meta' => 'Order #'.$latestSouvenir->id.' • '.$latestSouvenir->created_at->diffForHumans(),
                    'created_at' => $latestSouvenir->created_at?->timestamp ?? 0,
                ]);
            }

            $latestSpecial = $canSeeSpecial ? EventBooking::query()
                ->whereHas('event', fn ($q) => $q->where('event_type', 'special_program'))
                ->with('event')
                ->latest('created_at')
                ->first() : null;
            if ($latestSpecial) {
                $activities->push([
                    'title' => 'Booking special program '.($latestSpecial->event?->title ?? 'baru'),
                    'meta' => $latestSpecial->quantity.' tiket • '.$latestSpecial->created_at->diffForHumans(),
                    'created_at' => $latestSpecial->created_at?->timestamp ?? 0,
                ]);
            }
        }

        $activities = $activities->sortByDesc('created_at')->take(4)->values()->all();

        if ($scope === 'academy') {
            return Inertia::render('dashboard', [
                'scope' => $scope,
                'summary' => [
                    'transactions_today' => $academyBookingsToday,
                    'tickets_sold' => $academyTicketsSoldToday,
                    'active_partners' => AcademyClass::query()->where('is_active', true)->count(),
                ],
                'system' => [
                    'pending_reviews' => AcademyRefund::query()->where('status', 'pending')->count(),
                    'pending_payouts' => 0,
                    'pending_payments' => AcademyBooking::query()->where('status', 'pending_payment')->count(),
                ],
                'activities' => $activities,
            ]);
        }

        if ($scope === 'retail') {
            return Inertia::render('dashboard', [
                'scope' => $scope,
                'summary' => [
                    'transactions_today' => $souvenirOrdersToday,
                    'tickets_sold' => $souvenirItemsSoldToday,
                    'active_partners' => SouvenirProduct::query()->where('is_active', true)->count(),
                ],
                'system' => [
                    'pending_reviews' => SouvenirRefund::query()->where('status', 'pending')->count(),
                    'pending_payouts' => 0,
                    'pending_payments' => SouvenirOrder::query()->where('status', 'pending_payment')->count(),
                ],
                'activities' => $activities,
            ]);
        }

        if ($scope === 'special') {
            return Inertia::render('dashboard', [
                'scope' => $scope,
                'summary' => [
                    'transactions_today' => $specialProgramBookingsToday,
                    'tickets_sold' => $specialProgramTicketsSoldToday,
                    'active_partners' => Event::query()
                        ->where('event_type', 'special_program')
                        ->where('status', 'published')
                        ->count(),
                ],
                'system' => [
                    'pending_reviews' => 0,
                    'pending_payouts' => 0,
                    'pending_payments' => EventBooking::query()
                        ->whereHas('event', fn ($q) => $q->where('event_type', 'special_program'))
                        ->where('status', 'pending_payment')
                        ->count(),
                ],
                'activities' => $activities,
            ]);
        }

        if ($scope === 'custom') {
            $customTransactionsToday = 0;
            $customTicketsSoldToday = 0;
            $customActiveItems = 0;
            $customPendingReviews = 0;
            $customPendingPayouts = 0;
            $customPendingPayments = 0;

            if ($canSeeHotel) {
                $customTransactionsToday += $hotelBookingsToday;
                $customTicketsSoldToday += $hotelRoomsSoldToday;
                $customActiveItems += MitraOnboarding::query()->where('verification_status', 'verified')->count();
                $customPendingReviews += MitraOnboarding::query()->where('verification_status', 'pending')->count();
                $customPendingPayouts += MitraOnboarding::query()->where('payout_status', 'pending')->count();
                $customPendingPayments += Booking::query()->where('status', 'pending_payment')->count();
            }

            if ($canSeeWisata) {
                $customTransactionsToday += $wisataBookingsToday;
                $customTicketsSoldToday += $wisataTicketsSoldToday;
                $customActiveItems += MitraWisataOnboarding::query()
                    ->where('verification_status', 'verified')
                    ->where('is_suspended', false)
                    ->count();
                $customPendingReviews += MitraWisataOnboarding::query()->where('verification_status', 'pending')->count();
                $customPendingPayouts += MitraWisataOnboarding::query()->where('payout_status', 'pending')->count();
                $customPendingPayments += WisataBooking::query()->where('status', 'pending_payment')->count();
            }

            if ($canSeeEvent) {
                $customTransactionsToday += $eventBookingsToday;
                $customTicketsSoldToday += $eventTicketsSoldToday;
                $customActiveItems += MitraEventOnboarding::query()->where('verification_status', 'verified')->count();
                $customPendingReviews += MitraEventOnboarding::query()->where('verification_status', 'pending')->count();
                $customPendingPayments += EventBooking::query()
                    ->whereHas('event', fn ($q) => $q->where('event_type', 'event'))
                    ->where('status', 'pending_payment')
                    ->count();
            }

            if ($canSeeAcademy) {
                $customTransactionsToday += $academyBookingsToday;
                $customTicketsSoldToday += $academyTicketsSoldToday;
                $customActiveItems += AcademyClass::query()->where('is_active', true)->count();
                $customPendingPayments += AcademyBooking::query()->where('status', 'pending_payment')->count();
            }

            if ($canSeeRetail) {
                $customTransactionsToday += $souvenirOrdersToday;
                $customTicketsSoldToday += $souvenirItemsSoldToday;
                $customActiveItems += SouvenirProduct::query()->where('is_active', true)->count();
                $customPendingReviews += SouvenirRefund::query()->where('status', 'pending')->count();
                $customPendingPayments += SouvenirOrder::query()->where('status', 'pending_payment')->count();
            }

            if ($canSeeSpecial) {
                $customTransactionsToday += $specialProgramBookingsToday;
                $customTicketsSoldToday += $specialProgramTicketsSoldToday;
                $customActiveItems += Event::query()
                    ->where('event_type', 'special_program')
                    ->where('status', 'published')
                    ->count();
                $customPendingPayments += EventBooking::query()
                    ->whereHas('event', fn ($q) => $q->where('event_type', 'special_program'))
                    ->where('status', 'pending_payment')
                    ->count();
            }

            return Inertia::render('dashboard', [
                'scope' => $scope,
                'summary' => [
                    'transactions_today' => $customTransactionsToday,
                    'tickets_sold' => $customTicketsSoldToday,
                    'active_partners' => $customActiveItems,
                ],
                'system' => [
                    'pending_reviews' => $customPendingReviews,
                    'pending_payouts' => $customPendingPayouts,
                    'pending_payments' => $customPendingPayments,
                ],
                'activities' => $activities,
            ]);
        }

        return Inertia::render('dashboard', [
            'scope' => $scope,
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
