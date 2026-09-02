<?php

namespace App\Http\Controllers\Mitra;

use App\Http\Controllers\Controller;
use App\Models\MitraWisataOnboarding;
use App\Models\PartnerTermsDocument;
use App\Models\PartnerTermsSignature;
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
        $onboardingType = $request->user()->mitra_onboarding_type === 'wisata'
            ? 'wisata'
            : null;
        $wisataOnboarding = null;
        if ($onboardingType === 'wisata') {
            $wisataOnboarding = MitraWisataOnboarding::query()->firstOrCreate([
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

        return Inertia::render('mitra/dashboard', [
            'wisataOnboarding' => $wisataOnboarding,
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
        $businessType = $user?->mitra_onboarding_type;

        if ($businessType !== 'wisata') {
            return null;
        }

        $verified = $user->mitraWisataOnboarding?->verification_status === 'verified';

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
