<?php

use App\Models\AdminPermission;
use App\Models\AdminRole;
use App\Models\User;
use App\Support\AdminPermissionRegistry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

function superAdminForRoleTest(): User
{
    return User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);
}

test('super admin can perform crud on custom admin roles with sub feature permissions', function () {
    $admin = superAdminForRoleTest();

    $this->actingAs($admin)
        ->post('/admin/system/roles', [
            'name' => 'Operator Hotel Booking',
            'description' => 'Mengelola booking hotel saja.',
            'is_active' => true,
            'permissions' => [
                'hotel_bookings.view',
                'hotel_bookings.update',
                'hotel_properties.view',
            ],
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $role = AdminRole::query()->where('slug', 'operator-hotel-booking')->firstOrFail();

    expect($role->permissions()->count())->toBe(3)
        ->and($role->permissions()->where('feature', 'hotel_bookings')->where('action', 'view')->exists())->toBeTrue()
        ->and($role->permissions()->where('feature', 'hotel_properties')->where('action', 'view')->exists())->toBeTrue();

    $this->actingAs($admin)
        ->put("/admin/system/roles/{$role->id}", [
            'name' => 'Operator Hotel Finance',
            'description' => 'Mengelola finance hotel.',
            'is_active' => false,
            'permissions' => [
                'hotel_finance.view',
                'hotel_finance.update',
            ],
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $role->refresh();

    expect($role->name)->toBe('Operator Hotel Finance')
        ->and($role->is_active)->toBeFalse()
        ->and($role->permissions()->count())->toBe(2)
        ->and($role->permissions()->where('feature', 'hotel_bookings')->exists())->toBeFalse();

    $this->actingAs($admin)
        ->delete("/admin/system/roles/{$role->id}")
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect(AdminRole::query()->whereKey($role->id)->exists())->toBeFalse();
});

test('super admin can assign every built in role and a custom role', function () {
    $admin = superAdminForRoleTest();
    $target = User::factory()->create([
        'role' => 'user',
        'email_verified_at' => now(),
    ]);

    foreach (['user', 'mitra', 'admin', 'admin_academy', 'admin_retail', 'admin_special_program'] as $assignment) {
        $this->actingAs($admin)
            ->put("/admin/system/roles/users/{$target->id}", ['assignment' => $assignment])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $target->refresh();
        expect($target->role)->toBe($assignment)
            ->and($target->admin_role_id)->toBeNull();
    }

    $customRole = AdminRole::query()->create([
        'name' => 'Operator Wisata',
        'slug' => 'operator-wisata',
        'is_active' => true,
    ]);
    $permission = AdminPermission::query()->firstOrCreate(
        ['feature' => 'wisata_tickets', 'action' => 'view'],
        ['label' => 'Wisata - Tiket - Lihat'],
    );
    $customRole->permissions()->sync([$permission->id]);

    $this->actingAs($admin)
        ->put("/admin/system/roles/users/{$target->id}", ['assignment' => 'custom:'.$customRole->id])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $target->refresh();
    expect($target->role)->toBe('admin_custom')
        ->and($target->admin_role_id)->toBe($customRole->id);
});

test('custom role that is assigned to a user cannot be deleted', function () {
    $admin = superAdminForRoleTest();
    $role = AdminRole::query()->create([
        'name' => 'Dipakai User',
        'slug' => 'dipakai-user',
        'is_active' => true,
    ]);
    User::factory()->create([
        'role' => 'admin_custom',
        'admin_role_id' => $role->id,
        'email_verified_at' => now(),
    ]);

    $this->actingAs($admin)
        ->delete("/admin/system/roles/{$role->id}")
        ->assertSessionHasErrors('role');

    expect(AdminRole::query()->whereKey($role->id)->exists())->toBeTrue();
});

test('custom role permission controls access to sub features', function () {
    $role = AdminRole::query()->create([
        'name' => 'Hanya Tiket Wisata',
        'slug' => 'hanya-tiket-wisata',
        'is_active' => true,
    ]);
    $permission = AdminPermission::query()->firstOrCreate(
        ['feature' => 'wisata_tickets', 'action' => 'view'],
        ['label' => 'Wisata - Tiket - Lihat'],
    );
    $role->permissions()->sync([$permission->id]);

    $admin = User::factory()->create([
        'role' => 'admin_custom',
        'admin_role_id' => $role->id,
        'email_verified_at' => now(),
    ]);

    $this->actingAs($admin)
        ->get('/admin/wisata/tickets')
        ->assertOk();

    $this->actingAs($admin)
        ->get('/admin/wisata/destinations')
        ->assertForbidden();
});

test('custom role exposes hotel wisata and event sub feature permissions for admin sidebar', function () {
    $role = AdminRole::query()->create([
        'name' => 'Operator Multi Produk',
        'slug' => 'operator-multi-produk',
        'is_active' => true,
    ]);

    $permissions = collect(['hotel_properties', 'wisata_destinations', 'events_items'])
        ->map(fn (string $feature) => AdminPermission::query()->firstOrCreate(
            ['feature' => $feature, 'action' => 'view'],
            ['label' => "{$feature}.view"],
        ));

    $role->permissions()->sync($permissions->pluck('id')->all());

    $admin = User::factory()->create([
        'role' => 'admin_custom',
        'admin_role_id' => $role->id,
        'email_verified_at' => now(),
    ]);

    expect(AdminPermissionRegistry::permissionKeysForUser($admin))
        ->toContain('hotel_properties.view')
        ->toContain('wisata_destinations.view')
        ->toContain('events_items.view');

    $this->actingAs($admin)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('auth.user.admin_permissions', fn ($permissions) => collect($permissions)->contains('hotel_properties.view')
                && collect($permissions)->contains('wisata_destinations.view')
                && collect($permissions)->contains('events_items.view')
            ));
});

test('permission matrix exposes retail shop sub features with crud actions', function () {
    $admin = superAdminForRoleTest();

    $this->actingAs($admin)
        ->get('/admin/system/roles')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('permissionMatrix.features', fn ($features) => collect($features)
                ->contains(fn ($feature) => $feature['key'] === 'retail_products'
                    && $feature['parent'] === 'Retail Shop')
                && collect($features)->contains(fn ($feature) => $feature['key'] === 'retail_orders')
                && collect($features)->contains(fn ($feature) => $feature['key'] === 'retail_system'))
            ->where('permissionMatrix.actions', fn ($actions) => collect($actions)->pluck('key')->all() === [
                'view',
                'create',
                'update',
                'delete',
            ]));
});

test('role management expands legacy permissions before editing role', function () {
    $admin = superAdminForRoleTest();
    $role = AdminRole::query()->create([
        'name' => 'Role Lama Konten Publik',
        'slug' => 'role-lama-konten-publik',
        'is_active' => true,
    ]);
    $legacyPermission = AdminPermission::query()->create([
        'feature' => 'public_content',
        'action' => 'view',
        'label' => 'Konten Publik - Lihat',
    ]);
    $role->permissions()->sync([$legacyPermission->id]);

    $this->actingAs($admin)
        ->get('/admin/system/roles')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('roles.0.permissions', fn ($permissions) => collect($permissions)->contains('public_home.view')
                && collect($permissions)->contains('public_banners.view')
                && collect($permissions)->contains('public_promo_items.view')
                && collect($permissions)->contains('public_partners.view')
                && ! collect($permissions)->contains('public_content.view')));

    $this->actingAs($admin)
        ->put("/admin/system/roles/{$role->id}", [
            'name' => 'Role Lama Konten Publik Updated',
            'description' => 'Legacy permission tetap bisa disimpan.',
            'is_active' => true,
            'permissions' => [
                'public_content.view',
                'system.view',
            ],
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $role->refresh();
    expect($role->permissions()->where('feature', 'public_home')->where('action', 'view')->exists())->toBeTrue()
        ->and($role->permissions()->where('feature', 'public_banners')->where('action', 'view')->exists())->toBeTrue()
        ->and($role->permissions()->where('feature', 'public_promo_items')->where('action', 'view')->exists())->toBeTrue()
        ->and($role->permissions()->where('feature', 'public_partners')->where('action', 'view')->exists())->toBeTrue()
        ->and($role->permissions()->where('feature', 'system_audit')->where('action', 'view')->exists())->toBeTrue()
        ->and($role->permissions()->where('feature', 'public_content')->exists())->toBeFalse();
});
