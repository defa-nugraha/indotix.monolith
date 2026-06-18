<?php

use App\Models\AdminPermission;
use App\Models\AdminRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

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
