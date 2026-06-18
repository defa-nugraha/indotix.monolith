<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminPermissionRegistry
{
    public static function features(): array
    {
        return config('admin_permissions.features', []);
    }

    public static function actions(): array
    {
        return config('admin_permissions.actions', []);
    }

    public static function permissionKeysForUser(?User $user): array
    {
        if (! $user) {
            return [];
        }

        if ($user->role === 'admin') {
            return collect(self::features())
                ->keys()
                ->flatMap(fn (string $feature) => collect(array_keys(self::actions()))
                    ->map(fn (string $action) => "{$feature}.{$action}"))
                ->values()
                ->all();
        }

        $role = $user->adminRole;
        if (! $role || ! $role->is_active) {
            return [];
        }

        return $role->permissions
            ->map(fn ($permission) => "{$permission->feature}.{$permission->action}")
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

        $fallbackFeature = Str::before($feature, '_');

        return $role->permissions
            ->contains(fn ($permission) => $permission->action === $action
                && ($permission->feature === $feature || $permission->feature === $fallbackFeature));
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
