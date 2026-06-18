<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MitraWisataOnboarding;
use App\Models\WisataAffiliate;
use App\Models\WisataAffiliateClick;
use App\Models\WisataAffiliateCommission;
use App\Models\WisataAffiliateCommissionItem;
use App\Models\WisataAffiliateLink;
use App\Models\WisataAffiliatePayout;
use App\Models\WisataAffiliateSetting;
use App\Models\WisataTicket;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AffiliateController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        $this->ensureUserRole($request);

        $affiliate = $this->affiliateFor($request)
            ?->load('links', 'destination');

        return response()->json([
            'registered' => (bool) $affiliate,
            'affiliate' => $affiliate ? $this->affiliatePayload($affiliate) : null,
            'stats' => $affiliate ? $this->statsPayload($affiliate) : $this->emptyStats(),
        ]);
    }

    public function destinations(Request $request): JsonResponse
    {
        $this->ensureUserRole($request);

        $destinations = MitraWisataOnboarding::query()
            ->publiclyVisible()
            ->orderBy('destination_name')
            ->get()
            ->map(fn (MitraWisataOnboarding $destination) => [
                'id' => $destination->id,
                'destination_name' => $destination->destination_name,
                'city_name' => $destination->city_code
                    ? DB::table('regencies')->where('code', $destination->city_code)->value('name')
                    : null,
            ])
            ->values();

        return response()->json(['destinations' => $destinations]);
    }

    public function register(Request $request): JsonResponse
    {
        $this->ensureUserRole($request);

        $existing = $this->affiliateFor($request);
        if ($existing) {
            return response()->json([
                'message' => 'Kamu sudah terdaftar sebagai afiliator wisata.',
                'affiliate' => $this->affiliatePayload($existing),
            ]);
        }

        $data = $request->validate([
            'wisata_id' => ['required', 'integer', 'exists:mitra_wisata_onboardings,id'],
            'phone' => ['required', 'string', 'max:30'],
            'type' => ['required', 'in:individu,komunitas,media'],
            'platform' => ['nullable', 'string', 'max:255'],
            'bank_name' => ['nullable', 'string', 'max:100'],
            'bank_account_number' => ['nullable', 'string', 'max:100'],
            'bank_account_name' => ['nullable', 'string', 'max:100'],
        ]);

        $destination = MitraWisataOnboarding::query()
            ->publiclyVisible()
            ->where('id', $data['wisata_id'])
            ->firstOrFail();

        $affiliate = WisataAffiliate::create([
            'user_id' => $request->user()->id,
            'wisata_id' => $destination->id,
            'name' => $request->user()->name ?? 'Affiliate',
            'email' => $request->user()->email,
            'phone' => $data['phone'],
            'type' => $data['type'],
            'platform' => $data['platform'] ?? null,
            'status' => 'pending_review',
            'bank_name' => $data['bank_name'] ?? null,
            'bank_account_number' => $data['bank_account_number'] ?? null,
            'bank_account_name' => $data['bank_account_name'] ?? null,
        ]);

        return response()->json([
            'message' => 'Pendaftaran afiliasi sudah dikirim.',
            'affiliate' => $this->affiliatePayload($affiliate),
        ], 201);
    }

    public function profile(Request $request): JsonResponse
    {
        $affiliate = $this->requireAffiliate($request);

        return response()->json(['affiliate' => $this->affiliatePayload($affiliate)]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $affiliate = $this->requireAffiliate($request);

        $data = $request->validate([
            'phone' => ['required', 'string', 'max:30'],
            'platform' => ['nullable', 'string', 'max:255'],
            'bank_name' => ['nullable', 'string', 'max:100'],
            'bank_account_number' => ['nullable', 'string', 'max:100'],
            'bank_account_name' => ['nullable', 'string', 'max:100'],
        ]);

        $affiliate->update($data);

        return response()->json([
            'message' => 'Profil afiliasi berhasil diperbarui.',
            'affiliate' => $this->affiliatePayload($affiliate->refresh()),
        ]);
    }

    public function links(Request $request): JsonResponse
    {
        $affiliate = $this->requireAffiliate($request)->load('links', 'destination');
        $link = $affiliate->links->sortByDesc('id')->first();

        return response()->json([
            'affiliate' => $this->affiliatePayload($affiliate),
            'link' => $link ? $this->linkPayload($link, $request) : null,
            'destination' => $affiliate->destination ? $this->destinationPayload($affiliate->destination) : null,
        ]);
    }

    public function createLink(Request $request): JsonResponse
    {
        $affiliate = $this->requireAffiliate($request)->load('links');

        if ($affiliate->links->isNotEmpty()) {
            $link = $affiliate->links->sortByDesc('id')->first();

            return response()->json([
                'message' => 'Link afiliasi sudah tersedia.',
                'link' => $this->linkPayload($link, $request),
            ]);
        }

        $setting = WisataAffiliateSetting::query()->first();
        $link = WisataAffiliateLink::create([
            'affiliate_id' => $affiliate->id,
            'code' => strtoupper(Str::random(6)),
            'token' => Str::random(32),
            'landing_url' => null,
            'status' => 'active',
            'attribution_model' => $setting?->attribution_model ?? 'last_click',
            'cookie_days' => $setting?->cookie_days ?? 7,
        ]);

        return response()->json([
            'message' => 'Link afiliasi berhasil dibuat.',
            'link' => $this->linkPayload($link, $request),
        ], 201);
    }

    public function catalog(Request $request): JsonResponse
    {
        $affiliate = $this->requireAffiliate($request);
        $destination = $affiliate->wisata_id
            ? MitraWisataOnboarding::query()->publiclyVisible()->find($affiliate->wisata_id)
            : null;

        $tickets = collect();
        $commission = null;

        if ($destination) {
            $tickets = WisataTicket::query()
                ->where('mitra_wisata_onboarding_id', $destination->id)
                ->where('is_active', true)
                ->where('is_closed', false)
                ->orderBy('name')
                ->get()
                ->map(fn (WisataTicket $ticket) => [
                    'id' => $ticket->id,
                    'name' => $ticket->name,
                    'price' => (int) $ticket->price,
                    'ticket_type' => $ticket->ticket_type,
                ])
                ->values();

            $commission = $this->activeCommission($destination->id);
        }

        return response()->json([
            'destination' => $destination ? $this->destinationPayload($destination) : null,
            'tickets' => $tickets,
            'commission' => $commission ? [
                'type' => $commission->type,
                'value' => (int) $commission->value,
                'source' => $commission->source,
            ] : null,
        ]);
    }

    public function commissions(Request $request): JsonResponse
    {
        $affiliate = $this->requireAffiliate($request);
        $status = $request->query('status');

        $items = WisataAffiliateCommissionItem::query()
            ->where('affiliate_id', $affiliate->id)
            ->when($status, fn ($query) => $query->where('status', $status))
            ->with(['booking.ticket', 'booking.destination'])
            ->latest('id')
            ->paginate(min(max((int) $request->query('per_page', 20), 1), 100));

        return response()->json([
            'items' => collect($items->items())->map(fn (WisataAffiliateCommissionItem $item) => [
                'id' => $item->id,
                'commission_amount' => (int) $item->commission_amount,
                'status' => $item->status,
                'reason' => $item->reason,
                'created_at' => optional($item->created_at)->toISOString(),
                'booking' => $item->booking ? [
                    'id' => $item->booking->id,
                    'booking_code' => $item->booking->booking_code,
                    'total_price' => (int) $item->booking->total_price,
                    'destination_name' => $item->booking->destination?->destination_name,
                    'ticket_name' => $item->booking->ticket?->name,
                ] : null,
            ])->values(),
            'meta' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'total' => $items->total(),
            ],
            'filters' => ['status' => $status],
        ]);
    }

    public function payouts(Request $request): JsonResponse
    {
        $affiliate = $this->requireAffiliate($request);

        return response()->json($this->payoutPayload($affiliate));
    }

    public function requestPayout(Request $request): JsonResponse
    {
        $affiliate = $this->requireAffiliate($request);
        $payload = $this->payoutPayload($affiliate);
        $available = (int) $payload['available'];
        $minPayout = (int) $payload['min_payout'];

        if ($available <= 0 || $available < $minPayout) {
            return response()->json([
                'message' => 'Saldo belum memenuhi minimum payout.',
                ...$payload,
            ], 422);
        }

        WisataAffiliatePayout::create([
            'affiliate_id' => $affiliate->id,
            'total_commission' => $available,
            'status' => 'pending',
            'bank_name' => $affiliate->bank_name,
            'bank_account_number' => $affiliate->bank_account_number,
            'bank_account_name' => $affiliate->bank_account_name,
        ]);

        return response()->json([
            'message' => 'Permintaan payout berhasil dikirim.',
            ...$this->payoutPayload($affiliate),
        ], 201);
    }

    private function ensureUserRole(Request $request): void
    {
        if ($request->user()?->role !== 'user') {
            throw new HttpResponseException(response()->json([
                'message' => 'Fitur afiliasi wisata hanya tersedia untuk akun user.',
            ], 403));
        }
    }

    private function affiliateFor(Request $request): ?WisataAffiliate
    {
        return WisataAffiliate::query()
            ->where('user_id', $request->user()->id)
            ->first();
    }

    private function requireAffiliate(Request $request): WisataAffiliate
    {
        $this->ensureUserRole($request);

        $affiliate = WisataAffiliate::query()
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $affiliate) {
            throw new HttpResponseException(response()->json([
                'message' => 'Kamu belum terdaftar sebagai afiliator wisata.',
            ], 404));
        }

        return $affiliate;
    }

    private function affiliatePayload(WisataAffiliate $affiliate): array
    {
        $affiliate->loadMissing('destination');

        return [
            'id' => $affiliate->id,
            'name' => $affiliate->name,
            'email' => $affiliate->email,
            'phone' => $affiliate->phone,
            'type' => $affiliate->type,
            'platform' => $affiliate->platform,
            'status' => $affiliate->status,
            'notes' => $affiliate->notes,
            'bank_name' => $affiliate->bank_name,
            'bank_account_number' => $affiliate->bank_account_number,
            'bank_account_name' => $affiliate->bank_account_name,
            'destination' => $affiliate->destination ? $this->destinationPayload($affiliate->destination) : null,
        ];
    }

    private function destinationPayload(MitraWisataOnboarding $destination): array
    {
        return [
            'id' => $destination->id,
            'encrypted_id' => Crypt::encryptString((string) $destination->id),
            'slug' => $destination->slug,
            'destination_name' => $destination->destination_name,
            'destination_type' => $destination->destination_type,
            'address_full' => $destination->address_full,
            'photo_area_url' => $destination->photo_area_path ? '/storage/'.$destination->photo_area_path : null,
        ];
    }

    private function statsPayload(WisataAffiliate $affiliate): array
    {
        $affiliate->loadMissing('links');
        $linkIds = $affiliate->links->pluck('id');
        $totalClicks = $linkIds->isEmpty()
            ? 0
            : WisataAffiliateClick::query()->whereIn('affiliate_link_id', $linkIds)->count();
        $totalBookings = WisataAffiliateCommissionItem::query()
            ->where('affiliate_id', $affiliate->id)
            ->count();
        $totalCommission = WisataAffiliateCommissionItem::query()
            ->where('affiliate_id', $affiliate->id)
            ->sum('commission_amount');
        $approvedCommission = WisataAffiliateCommissionItem::query()
            ->where('affiliate_id', $affiliate->id)
            ->where('status', 'approved')
            ->sum('commission_amount');
        $pendingCommission = WisataAffiliateCommissionItem::query()
            ->where('affiliate_id', $affiliate->id)
            ->where('status', 'pending')
            ->sum('commission_amount');

        return [
            'total_clicks' => $totalClicks,
            'total_bookings' => $totalBookings,
            'conversion_rate' => $totalClicks > 0 ? round(($totalBookings / $totalClicks) * 100, 2) : 0,
            'total_commission' => (int) $totalCommission,
            'approved_commission' => (int) $approvedCommission,
            'pending_commission' => (int) $pendingCommission,
        ];
    }

    private function emptyStats(): array
    {
        return [
            'total_clicks' => 0,
            'total_bookings' => 0,
            'conversion_rate' => 0,
            'total_commission' => 0,
            'approved_commission' => 0,
            'pending_commission' => 0,
        ];
    }

    private function linkPayload(WisataAffiliateLink $link, Request $request): array
    {
        $baseUrl = rtrim(config('app.url') ?: $request->getSchemeAndHttpHost(), '/');

        return [
            'id' => $link->id,
            'code' => $link->code,
            'token' => $link->token,
            'landing_url' => $link->landing_url,
            'status' => $link->status,
            'attribution_model' => $link->attribution_model,
            'cookie_days' => (int) $link->cookie_days,
            'referral_url' => "{$baseUrl}/wisata/{$link->code}",
        ];
    }

    private function activeCommission(int $destinationId): ?WisataAffiliateCommission
    {
        $today = now()->toDateString();

        return WisataAffiliateCommission::query()
            ->where('scope_type', 'wisata')
            ->where('wisata_id', $destinationId)
            ->where(fn ($query) => $query->whereNull('start_date')->orWhere('start_date', '<=', $today))
            ->where(fn ($query) => $query->whereNull('end_date')->orWhere('end_date', '>=', $today))
            ->latest('id')
            ->first()
            ?: WisataAffiliateCommission::query()
                ->where('scope_type', 'global')
                ->where(fn ($query) => $query->whereNull('start_date')->orWhere('start_date', '<=', $today))
                ->where(fn ($query) => $query->whereNull('end_date')->orWhere('end_date', '>=', $today))
                ->latest('id')
                ->first();
    }

    private function payoutPayload(WisataAffiliate $affiliate): array
    {
        $payouts = WisataAffiliatePayout::query()
            ->where('affiliate_id', $affiliate->id)
            ->latest('id')
            ->get()
            ->map(fn (WisataAffiliatePayout $payout) => [
                'id' => $payout->id,
                'total_commission' => (int) $payout->total_commission,
                'status' => $payout->status,
                'notes' => $payout->notes,
                'created_at' => optional($payout->created_at)->toISOString(),
            ])
            ->values();

        $approvedTotal = WisataAffiliateCommissionItem::query()
            ->where('affiliate_id', $affiliate->id)
            ->where('status', 'approved')
            ->sum('commission_amount');
        $reserved = WisataAffiliatePayout::query()
            ->where('affiliate_id', $affiliate->id)
            ->whereIn('status', ['pending', 'approved', 'paid'])
            ->sum('total_commission');
        $setting = WisataAffiliateSetting::query()->first();

        return [
            'payouts' => $payouts,
            'available' => max(0, (int) $approvedTotal - (int) $reserved),
            'min_payout' => (int) ($setting?->min_payout ?? 0),
            'affiliate' => [
                'bank_name' => $affiliate->bank_name,
                'bank_account_number' => $affiliate->bank_account_number,
                'bank_account_name' => $affiliate->bank_account_name,
            ],
        ];
    }
}
