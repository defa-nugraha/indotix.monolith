<?php

namespace App\Http\Controllers\Mitra;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Event;
use App\Models\EventBooking;
use App\Models\EventOrganizer;
use App\Models\EventScan;
use App\Models\Hotel;
use App\Models\MitraEventOnboarding;
use App\Models\MitraOnboarding;
use App\Models\MitraWisataOnboarding;
use App\Models\PartnerTermsDocument;
use App\Models\PartnerTermsSignature;
use App\Models\RoomType;
use App\Models\WisataBooking;
use App\Models\WisataBookingItem;
use App\Models\WisataTicket;
use App\Models\WisataTicketScan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $onboardingType = $request->user()->mitra_onboarding_type;
        $onboarding = null;
        $wisataOnboarding = null;
        $eventOnboarding = null;
        if ($onboardingType === 'hotel') {
            $onboarding = MitraOnboarding::query()->firstOrCreate([
                'user_id' => $request->user()->id,
            ]);
        }
        if ($onboardingType === 'wisata') {
            $wisataOnboarding = MitraWisataOnboarding::query()->firstOrCreate([
                'user_id' => $request->user()->id,
            ]);
        }
        if ($onboardingType === 'event') {
            $eventOnboarding = MitraEventOnboarding::query()->firstOrCreate([
                'user_id' => $request->user()->id,
            ]);
        }
        $user = $request->user();
        $today = now()->toDateString();
        $monthStart = now()->startOfMonth()->toDateString();
        $monthEnd = now()->endOfMonth()->toDateString();

        $metrics = [];
        $statusCards = [];
        $activities = [];

        if ($onboardingType === 'hotel') {
            $hotelIds = Hotel::query()
                ->where('vendor_id', $user->id)
                ->pluck('id');

            $todayBookings = Booking::query()
                ->whereIn('hotel_id', $hotelIds)
                ->whereIn('status', ['paid', 'completed'])
                ->whereDate('check_in', '<=', $today)
                ->whereDate('check_out', '>', $today)
                ->count();

            $monthlyRevenue = (int) Booking::query()
                ->whereIn('hotel_id', $hotelIds)
                ->whereIn('status', ['paid', 'completed'])
                ->where('payment_status', '!=', 'refunded')
                ->whereDate('check_out', '>=', $monthStart)
                ->whereDate('check_out', '<=', $monthEnd)
                ->sum('total');

            $totalRooms = (int) RoomType::query()
                ->whereIn('hotel_id', $hotelIds)
                ->sum('total_rooms');

            $roomsBookedToday = (int) Booking::query()
                ->whereIn('hotel_id', $hotelIds)
                ->whereIn('status', ['paid', 'completed'])
                ->whereDate('check_in', '<=', $today)
                ->whereDate('check_out', '>', $today)
                ->sum('rooms_count');

            $availableRooms = max(0, $totalRooms - $roomsBookedToday);

            $metrics = [
                [
                    'title' => 'Reservasi Hari Ini',
                    'value' => $todayBookings,
                    'detail' => 'Booking aktif hari ini',
                    'icon' => 'ticket',
                ],
                [
                    'title' => 'Pendapatan Bulan Ini',
                    'value' => 'Rp '.number_format($monthlyRevenue, 0, ',', '.'),
                    'detail' => 'Total booking paid/completed',
                    'icon' => 'credit',
                ],
                [
                    'title' => 'Kamar Tersedia',
                    'value' => $availableRooms,
                    'detail' => 'Kamar siap dijual',
                    'icon' => 'map',
                ],
            ];

            $pendingPayments = Booking::query()
                ->whereIn('hotel_id', $hotelIds)
                ->where('status', 'pending_payment')
                ->count();

            $paidThisMonth = Booking::query()
                ->whereIn('hotel_id', $hotelIds)
                ->whereIn('status', ['paid', 'completed'])
                ->whereDate('check_out', '>=', $monthStart)
                ->whereDate('check_out', '<=', $monthEnd)
                ->count();

            $statusCards = [
                [
                    'title' => 'Booking Pending',
                    'value' => $pendingPayments,
                    'note' => 'Menunggu pembayaran',
                    'accent' => 'bg-amber-50 text-amber-700',
                ],
                [
                    'title' => 'Booking Sukses Bulan Ini',
                    'value' => $paidThisMonth,
                    'note' => 'Paid & completed',
                    'accent' => 'bg-emerald-50 text-emerald-700',
                ],
                [
                    'title' => 'Akun Mitra',
                    'value' => $onboarding?->verification_status ?? 'draft',
                    'note' => 'Status verifikasi',
                    'accent' => ($onboarding?->verification_status ?? 'draft') === 'verified'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-600',
                ],
            ];

            $latestBookings = Booking::query()
                ->with('hotel')
                ->whereIn('hotel_id', $hotelIds)
                ->latest('created_at')
                ->take(4)
                ->get();

            $activities = $latestBookings->map(function (Booking $booking) {
                return [
                    'title' => 'Booking baru '.($booking->hotel?->name ?? 'hotel'),
                    'meta' => $booking->rooms_count.' kamar • '.$booking->created_at->diffForHumans(),
                ];
            })->all();
        }

        if ($onboardingType === 'wisata' && $wisataOnboarding) {
            $destinationId = $wisataOnboarding->id;
            $tickets = WisataTicket::query()
                ->where('mitra_wisata_onboarding_id', $destinationId)
                ->where('is_active', true)
                ->where('is_closed', false)
                ->get();

            $ticketsSoldToday = (int) WisataBooking::query()
                ->where('mitra_wisata_onboarding_id', $destinationId)
                ->whereIn('status', ['paid', 'completed'])
                ->whereDate('visit_date', $today)
                ->sum('quantity');

            $monthlyRevenue = (int) WisataBooking::query()
                ->where('mitra_wisata_onboarding_id', $destinationId)
                ->whereIn('status', ['paid', 'completed'])
                ->whereDate('visit_date', '>=', $monthStart)
                ->whereDate('visit_date', '<=', $monthEnd)
                ->sum('total_price');

            $availableQuota = 0;
            foreach ($tickets as $ticket) {
                $itemReserved = WisataBookingItem::query()
                    ->where('wisata_ticket_id', $ticket->id)
                    ->whereHas('booking', function ($query) use ($today) {
                        $query
                            ->whereDate('visit_date', $today)
                            ->whereIn('status', ['pending_payment', 'paid', 'completed']);
                    })
                    ->sum('quantity');
                $legacyReserved = WisataBooking::query()
                    ->where('wisata_ticket_id', $ticket->id)
                    ->whereDate('visit_date', $today)
                    ->whereIn('status', ['pending_payment', 'paid', 'completed'])
                    ->whereDoesntHave('items')
                    ->sum('quantity');
                $reserved = (int) $itemReserved + (int) $legacyReserved;
                $maxQuota = $ticket->daily_quota ?? $ticket->quota;
                $availableQuota += max(0, $maxQuota - $reserved);
            }

            $metrics = [
                [
                    'title' => 'Tiket Terjual Hari Ini',
                    'value' => $ticketsSoldToday,
                    'detail' => 'Total tiket untuk hari ini',
                    'icon' => 'ticket',
                ],
                [
                    'title' => 'Pendapatan Bulan Ini',
                    'value' => 'Rp '.number_format($monthlyRevenue, 0, ',', '.'),
                    'detail' => 'Transaksi paid/completed',
                    'icon' => 'credit',
                ],
                [
                    'title' => 'Kuota Tersedia Hari Ini',
                    'value' => $availableQuota,
                    'detail' => 'Sisa kuota tiket',
                    'icon' => 'map',
                ],
            ];

            $pendingPayments = WisataBooking::query()
                ->where('mitra_wisata_onboarding_id', $destinationId)
                ->where('status', 'pending_payment')
                ->count();

            $scansToday = WisataTicketScan::query()
                ->whereHas('booking', fn ($query) => $query->where('mitra_wisata_onboarding_id', $destinationId))
                ->whereDate('scanned_at', $today)
                ->count();

            $statusCards = [
                [
                    'title' => 'Booking Pending',
                    'value' => $pendingPayments,
                    'note' => 'Menunggu pembayaran',
                    'accent' => 'bg-amber-50 text-amber-700',
                ],
                [
                    'title' => 'Tiket Tervalidasi Hari Ini',
                    'value' => $scansToday,
                    'note' => 'QR scan hari ini',
                    'accent' => 'bg-emerald-50 text-emerald-700',
                ],
                [
                    'title' => 'Akun Mitra',
                    'value' => $wisataOnboarding->verification_status ?? 'draft',
                    'note' => 'Status verifikasi',
                    'accent' => ($wisataOnboarding->verification_status ?? 'draft') === 'verified'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-600',
                ],
            ];

            $latestBookings = WisataBooking::query()
                ->with('ticket')
                ->where('mitra_wisata_onboarding_id', $destinationId)
                ->latest('created_at')
                ->take(4)
                ->get();

            $activities = $latestBookings->map(function (WisataBooking $booking) {
                return [
                    'title' => 'Tiket wisata '.($booking->ticket?->name ?? 'baru'),
                    'meta' => $booking->quantity.' tiket • '.$booking->created_at->diffForHumans(),
                ];
            })->all();
        }

        if ($onboardingType === 'event') {
            $organizer = EventOrganizer::query()->where('user_id', $user->id)->first();
            $eventIds = $organizer
                ? Event::query()->where('event_organizer_id', $organizer->id)->pluck('id')
                : collect();

            $activeEvents = Event::query()
                ->whereIn('id', $eventIds)
                ->whereIn('status', ['published', 'open_for_sale'])
                ->count();

            $ticketsSoldMonth = (int) EventBooking::query()
                ->whereIn('event_id', $eventIds)
                ->whereIn('status', ['paid', 'completed'])
                ->whereDate('created_at', '>=', $monthStart)
                ->whereDate('created_at', '<=', $monthEnd)
                ->sum('quantity');

            $monthlyRevenue = (int) EventBooking::query()
                ->whereIn('event_id', $eventIds)
                ->whereIn('status', ['paid', 'completed'])
                ->whereDate('created_at', '>=', $monthStart)
                ->whereDate('created_at', '<=', $monthEnd)
                ->sum('total_price');

            $metrics = [
                [
                    'title' => 'Event Aktif',
                    'value' => $activeEvents,
                    'detail' => 'Event sedang berjalan',
                    'icon' => 'calendar',
                ],
                [
                    'title' => 'Tiket Terjual Bulan Ini',
                    'value' => $ticketsSoldMonth,
                    'detail' => 'Total tiket terjual',
                    'icon' => 'users',
                ],
                [
                    'title' => 'Pendapatan Bulan Ini',
                    'value' => 'Rp '.number_format($monthlyRevenue, 0, ',', '.'),
                    'detail' => 'Transaksi paid/completed',
                    'icon' => 'credit',
                ],
            ];

            $pendingPayments = EventBooking::query()
                ->whereIn('event_id', $eventIds)
                ->where('status', 'pending_payment')
                ->count();

            $scansToday = EventScan::query()
                ->whereHas('booking', fn ($query) => $query->whereIn('event_id', $eventIds))
                ->whereDate('scanned_at', $today)
                ->count();

            $statusCards = [
                [
                    'title' => 'Booking Pending',
                    'value' => $pendingPayments,
                    'note' => 'Menunggu pembayaran',
                    'accent' => 'bg-amber-50 text-amber-700',
                ],
                [
                    'title' => 'Check-in Hari Ini',
                    'value' => $scansToday,
                    'note' => 'Tiket discan',
                    'accent' => 'bg-emerald-50 text-emerald-700',
                ],
                [
                    'title' => 'Status EO',
                    'value' => $eventOnboarding?->verification_status ?? 'draft',
                    'note' => 'Status verifikasi',
                    'accent' => ($eventOnboarding?->verification_status ?? 'draft') === 'verified'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-600',
                ],
            ];

            $latestBookings = EventBooking::query()
                ->with('event')
                ->whereIn('event_id', $eventIds)
                ->latest('created_at')
                ->take(4)
                ->get();

            $activities = $latestBookings->map(function (EventBooking $booking) {
                return [
                    'title' => 'Booking event '.($booking->event?->title ?? 'baru'),
                    'meta' => $booking->quantity.' tiket • '.$booking->created_at->diffForHumans(),
                ];
            })->all();
        }

        return Inertia::render('mitra/dashboard', [
            'onboarding' => $onboarding,
            'wisataOnboarding' => $wisataOnboarding,
            'eventOnboarding' => $eventOnboarding ?? null,
            'onboardingType' => $onboardingType,
            'metrics' => $metrics,
            'activities' => $activities,
            'statusCards' => $statusCards,
            'termsRequirement' => $this->termsRequirement($request),
        ]);
    }

    private function termsRequirement(Request $request): ?array
    {
        $user = $request->user();
        $businessType = $user?->mitra_onboarding_type ?: 'hotel';

        if (! in_array($businessType, PartnerTermsDocument::BUSINESS_TYPES, true)) {
            return null;
        }

        $verified = match ($businessType) {
            'wisata' => $user->mitraWisataOnboarding?->verification_status === 'verified',
            'event' => $user->mitraEventOnboarding?->verification_status === 'verified',
            default => $user->mitraOnboarding?->verification_status === 'verified',
        };

        if (! $verified) {
            return null;
        }

        $document = PartnerTermsDocument::query()
            ->where('business_type', $businessType)
            ->first();

        if (! $document) {
            return null;
        }

        $signature = PartnerTermsSignature::query()
            ->where('partner_terms_document_id', $document->id)
            ->where('user_id', $user->id)
            ->first();

        return [
            'required' => $signature === null,
            'signed_at' => $signature?->signed_at?->toDateTimeString(),
            'business_type' => $businessType,
            'title' => $document->title,
            'file_url' => Storage::url($document->file_path),
        ];
    }
}
