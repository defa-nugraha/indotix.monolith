<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminPermission;
use App\Models\AdminRole;
use App\Models\User;
use App\Support\AdminPermissionRegistry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RoleManagementController extends Controller
{
    public function index(Request $request): Response
    {
        $this->syncPermissions();

        $userQuery = User::query()->with('adminRole');

        if ($request->filled('search')) {
            $term = '%'.$request->string('search')->toString().'%';
            $userQuery->where(function ($builder) use ($term) {
                $builder->where('name', 'like', $term)
                    ->orWhere('email', 'like', $term);
            });
        }

        if ($request->filled('role')) {
            $role = $request->string('role')->toString();

            if (Str::startsWith($role, 'custom:')) {
                $userQuery->where('admin_role_id', (int) Str::after($role, 'custom:'));
            } else {
                $userQuery->where('role', $role)->whereNull('admin_role_id');
            }
        }

        $paginator = $userQuery->latest('id')->paginate(\App\Support\PaginationOptions::perPage())->withQueryString();
        $users = $paginator->through(function (User $user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role ?? 'user',
                'admin_role_id' => $user->admin_role_id,
                'admin_role_name' => $user->adminRole?->name,
                'mitra_onboarding_type' => $user->mitra_onboarding_type,
                'is_suspended' => (bool) $user->is_suspended,
                'email_verified_at' => optional($user->email_verified_at)->toDateTimeString(),
                'created_at' => optional($user->created_at)->toDateTimeString(),
            ];
        });

        $roles = AdminRole::query()
            ->with(['permissions' => fn ($query) => $query->orderBy('feature')->orderBy('action')])
            ->withCount('users')
            ->orderBy('name')
            ->get()
            ->map(fn (AdminRole $role) => [
                'id' => $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
                'description' => $role->description,
                'is_active' => (bool) $role->is_active,
                'users_count' => $role->users_count,
                'permissions' => $role->permissions
                    ->map(fn (AdminPermission $permission) => "{$permission->feature}.{$permission->action}")
                    ->values()
                    ->all(),
            ]);

        return Inertia::render('admin/system/roles/index', [
            'users' => $users,
            'roles' => $roles,
            'filters' => [
                'search' => $request->string('search')->toString(),
                'role' => $request->string('role')->toString(),
            ],
            'roleOptions' => $this->roleOptions(),
            'permissionMatrix' => $this->permissionMatrix(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->syncPermissions();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active' => ['boolean'],
            'permissions' => ['array'],
            'permissions.*' => ['string', Rule::in($this->permissionKeys())],
        ]);

        DB::transaction(function () use ($data) {
            $role = AdminRole::create([
                'name' => $data['name'],
                'slug' => $this->uniqueSlug($data['name']),
                'description' => $data['description'] ?? null,
                'is_active' => $data['is_active'] ?? true,
            ]);

            $role->permissions()->sync($this->permissionIds($data['permissions'] ?? []));
        });

        return back()->with('status', 'admin-role-created');
    }

    public function update(Request $request, AdminRole $role): RedirectResponse
    {
        $this->syncPermissions();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active' => ['boolean'],
            'permissions' => ['array'],
            'permissions.*' => ['string', Rule::in($this->permissionKeys())],
        ]);

        DB::transaction(function () use ($role, $data) {
            $role->update([
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'is_active' => $data['is_active'] ?? true,
            ]);

            $role->permissions()->sync($this->permissionIds($data['permissions'] ?? []));
        });

        return back()->with('status', 'admin-role-updated');
    }

    public function destroy(AdminRole $role): RedirectResponse
    {
        if ($role->users()->exists()) {
            return back()->withErrors([
                'role' => 'Role masih dipakai user. Pindahkan user ke role lain terlebih dahulu.',
            ]);
        }

        $role->delete();

        return back()->with('status', 'admin-role-deleted');
    }

    public function assign(Request $request, User $user): RedirectResponse
    {
        $roles = collect($this->roleOptions())->pluck('value')->all();

        $data = $request->validate([
            'assignment' => ['required', 'string'],
        ]);

        if ($request->user()?->id === $user->id && $data['assignment'] !== 'admin') {
            return back()->withErrors([
                'assignment' => 'Role admin utama tidak boleh diubah pada akun sendiri.',
            ]);
        }

        if (Str::startsWith($data['assignment'], 'custom:')) {
            $roleId = (int) Str::after($data['assignment'], 'custom:');
            $adminRole = AdminRole::query()->whereKey($roleId)->where('is_active', true)->firstOrFail();

            $user->update([
                'role' => 'admin_custom',
                'admin_role_id' => $adminRole->id,
            ]);

            return back()->with('status', 'admin-role-assigned');
        }

        validator($data, [
            'assignment' => ['required', 'string', Rule::in($roles)],
        ])->validate();

        $user->update([
            'role' => $data['assignment'],
            'admin_role_id' => null,
        ]);

        return back()->with('status', 'role-updated');
    }

    private function syncPermissions(): void
    {
        foreach (AdminPermissionRegistry::features() as $feature => $definition) {
            foreach (AdminPermissionRegistry::actions() as $action => $actionLabel) {
                AdminPermission::firstOrCreate(
                    ['feature' => $feature, 'action' => $action],
                    ['label' => "{$definition['label']} - {$actionLabel}"],
                );
            }
        }
    }

    private function permissionMatrix(): array
    {
        return [
            'actions' => collect(AdminPermissionRegistry::actions())
                ->map(fn (string $label, string $key) => ['key' => $key, 'label' => $label])
                ->values()
                ->all(),
            'features' => collect(AdminPermissionRegistry::features())
                ->map(fn (array $feature, string $key) => [
                    'key' => $key,
                    'label' => $feature['label'],
                    'parent' => $feature['parent'] ?? null,
                ])
                ->values()
                ->all(),
        ];
    }

    private function permissionKeys(): array
    {
        return collect(AdminPermissionRegistry::features())
            ->keys()
            ->flatMap(fn (string $feature) => collect(array_keys(AdminPermissionRegistry::actions()))
                ->map(fn (string $action) => "{$feature}.{$action}"))
            ->values()
            ->all();
    }

    private function permissionIds(array $permissionKeys): array
    {
        return collect($permissionKeys)
            ->map(function (string $permissionKey) {
                [$feature, $action] = explode('.', $permissionKey, 2);

                return AdminPermission::query()
                    ->where('feature', $feature)
                    ->where('action', $action)
                    ->value('id');
            })
            ->filter()
            ->values()
            ->all();
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'admin-role';
        $slug = $base;
        $counter = 2;

        while (AdminRole::query()->where('slug', $slug)->exists()) {
            $slug = "{$base}-{$counter}";
            $counter++;
        }

        return $slug;
    }

    private function roleOptions(): array
    {
        return [
            ['value' => 'user', 'label' => 'User'],
            ['value' => 'mitra', 'label' => 'Mitra'],
            ['value' => 'admin', 'label' => 'Admin Utama'],
            ['value' => 'admin_academy', 'label' => 'Admin Academy'],
            ['value' => 'admin_retail', 'label' => 'Admin Retail Shop'],
            ['value' => 'admin_special_program', 'label' => 'Admin Special Program'],
        ];
    }
}
