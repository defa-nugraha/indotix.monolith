<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminPermissionRegistry
{
    private const LEGACY_FEATURE_GROUPS = [
        'academy' => [
            'academy_classes',
            'academy_tickets',
            'academy_bookings',
            'academy_scans',
            'academy_finance',
            'academy_system',
        ],
        'retail_shop' => [
            'retail_products',
            'retail_categories',
            'retail_variants',
            'retail_inventory',
            'retail_orders',
            'retail_refunds',
            'retail_promotions',
            'retail_reports',
            'retail_system',
        ],
        'blog' => ['blog_posts', 'blog_categories', 'blog_tags'],
        'public_content' => [
            'public_banners',
            'public_promo_videos',
            'public_promo_items',
            'public_contacts',
            'public_pages',
        ],
        'system' => [
            'system_audit',
            'system_settings',
            'system_notifications',
            'system_roles',
            'system_special_admins',
        ],
    ];
    public static function features(): array
    {
        return config('admin_permissions.features', []);
    }

    public static function actions(): array
    {
        return config('admin_permissions.actions', []);
    }

    public static function permissionKeys(): array
    {
        return collect(self::features())
            ->keys()
            ->flatMap(fn (string $feature) => collect(array_keys(self::actions()))
                ->map(fn (string $action) => "{$feature}.{$action}"))
            ->values()
            ->all();
    }

    public static function expandPermissionKeys(array $permissionKeys): array
    {
        $validKeys = array_flip(self::permissionKeys());

        return collect($permissionKeys)
            ->filter(fn ($permissionKey) => is_string($permissionKey) && str_contains($permissionKey, '.'))
            ->flatMap(function (string $permissionKey) {
                [$feature, $action] = explode('.', $permissionKey, 2);
                $features = self::LEGACY_FEATURE_GROUPS[$feature] ?? [$feature];

                return collect($features)->map(fn (string $feature) => "{$feature}.{$action}");
            })
            ->filter(fn (string $permissionKey) => isset($validKeys[$permissionKey]))
            ->unique()
            ->values()
            ->all();
    }

    public static function permissionKeysForUser(?User $user): array
    {
        if (! $user) {
            return [];
        }

        if ($user->role === 'admin') {
            return self::permissionKeys();
        }

        $role = $user->adminRole;
        if (! $role || ! $role->is_active) {
            return [];
        }

        return $role->permissions
            ->flatMap(function ($permission) {
                $features = self::LEGACY_FEATURE_GROUPS[$permission->feature] ?? [$permission->feature];

                return collect($features)->map(fn (string $feature) => "{$feature}.{$permission->action}");
            })
            ->values()
            ->all();
    }

    public static function can(?User $user, string $feature, string $action): bool
    {
        if (! $user) {
            return false;
        }

        if ($user->role === 'admin') {
            return true;
        }

        $role = $user->adminRole;
        if (! $role || ! $role->is_active) {
            return false;
        }

        return $role->permissions
            ->contains(function ($permission) use ($feature, $action) {
                if ($permission->action !== $action) {
                    return false;
                }

                $features = self::LEGACY_FEATURE_GROUPS[$permission->feature] ?? [$permission->feature];

                return in_array($feature, $features, true);
            });
    }

    public static function resolveRequest(Request $request): ?array
    {
        $feature = self::resolveFeature($request);

        if (! $feature) {
            return null;
        }

        return [
            'feature' => $feature,
            'action' => self::resolveAction($request),
        ];
    }

    private static function resolveFeature(Request $request): ?string
    {
        $routeName = (string) optional($request->route())->getName();

        $features = collect(self::features())
            ->sortByDesc(fn (array $feature) => max([
                ...array_map('strlen', $feature['patterns'] ?? []),
                ...array_map('strlen', $feature['paths'] ?? []),
                0,
            ]));

        foreach ($features as $key => $feature) {
            foreach ($feature['patterns'] ?? [] as $pattern) {
                if ($routeName !== '' && Str::is($pattern, $routeName)) {
                    return $key;
                }
            }

            foreach ($feature['paths'] ?? [] as $path) {
                if ($request->is($path)) {
                    return $key;
                }
            }
        }

        return null;
    }

    private static function resolveAction(Request $request): string
    {
        $routeName = (string) optional($request->route())->getName();
        $suffix = Str::afterLast($routeName, '.');

        if (in_array($suffix, ['index', 'show'], true)) {
            return 'view';
        }

        if (in_array($suffix, ['create', 'store'], true)) {
            return 'create';
        }

        if (in_array($suffix, ['edit', 'update', 'status', 'approve', 'transfer', 'verify', 'suspend', 'reply', 'broadcast', 'refund', 'cancel', 'dispute', 'payout', 'shipping', 'regenerate'], true)) {
            return 'update';
        }

        if (in_array($suffix, ['destroy', 'delete', 'force-delete'], true)) {
            return 'delete';
        }

        return match ($request->method()) {
            'POST' => 'create',
            'PUT', 'PATCH' => 'update',
            'DELETE' => 'delete',
            default => 'view',
        };
    }
}
