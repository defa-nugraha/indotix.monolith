<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Models\UserNotification;
use App\Models\SystemSetting;
use App\Models\WisataAffiliate;
use App\Models\WisataAffiliateLink;
use App\Models\MitraWisataOnboarding;
use App\Services\MaintenanceMode;
use App\Support\AdminPermissionRegistry;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $affiliateReferral = null;
        $defaultAddress = null;
        $user = $request->user();

        if ($user) {
            $user->loadMissing('adminRole.permissions');
            $defaultAddress = $user->defaultAddressValue();
        }

        if ($user || $request->session()->has('affiliate_ref') || $request->cookie('affiliate_ref')) {
            $payload = $request->session()->get('affiliate_ref');
            if (! $payload && $request->cookie('affiliate_ref')) {
                $payload = json_decode($request->cookie('affiliate_ref'), true);
            }

            if (is_array($payload) && isset($payload['link_id'])) {
                $link = WisataAffiliateLink::query()
                    ->with('affiliate')
                    ->where('id', $payload['link_id'])
                    ->where('status', 'active')
                    ->first();

                if ($link && $link->affiliate && $link->affiliate->status === 'active') {
                    $setAt = (int) ($payload['set_at'] ?? 0);
                    $expiresAt = $setAt > 0 ? $setAt + ($link->cookie_days * 86400) : null;
                    if ($expiresAt && now()->timestamp > $expiresAt) {
                        $request->session()->forget('affiliate_ref');
                        $request->session()->save();
                    } else {
                        $destinationName = null;
                        if ($link->affiliate->wisata_id) {
                            $destinationName = MitraWisataOnboarding::query()
                                ->where('id', $link->affiliate->wisata_id)
                                ->value('destination_name');
                        }

                        $affiliateReferral = [
                            'code' => $link->code,
                            'destination_name' => $destinationName,
                            'expires_at' => $expiresAt ? now()->setTimestamp($expiresAt)->toDateTimeString() : null,
                        ];
                    }
                }
            }
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user ? [
                    ...$user->toArray(),
                    'admin_permissions' => AdminPermissionRegistry::permissionKeysForUser($user),
                    'admin_role_name' => $user->adminRole?->name,
                ] : null,
            ],
            'default_address' => $defaultAddress,
            'affiliate_menu' => $user
                ? (bool) WisataAffiliate::query()->where('user_id', $user->id)->exists()
                : false,
            'affiliate_status' => $user
                ? WisataAffiliate::query()->where('user_id', $user->id)->value('status')
                : null,
            'affiliate_referral' => $affiliateReferral,
            'maintenance_mode' => app(MaintenanceMode::class)->payload(),
            'public_whatsapp_number' => SystemSetting::query()
                ->where('key', 'public_whatsapp_number')
                ->value('value'),
            'unread_notifications' => $user
                ? UserNotification::query()
                    ->where('user_id', $user->id)
                    ->where('is_read', false)
                    ->count()
                : 0,
            'souvenir_cart_count' => collect($request->session()->get('souvenir_cart', []))
                ->sum(fn ($item) => (int) ($item['quantity'] ?? 0)),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
