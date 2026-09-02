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

test('admin role management routes stay unavailable after role menu retirement', function (string $method, string $uri) {
    $admin = superAdminForRoleTest();

    $this->actingAs($admin)
        ->call($method, $uri)
        ->assertNotFound();
})->with([
    ['GET', '/admin/system/roles'],
    ['POST', '/admin/system/roles'],
    ['PUT', '/admin/system/roles/1'],
    ['DELETE', '/admin/system/roles/1'],
    ['PUT', '/admin/system/roles/users/1'],
]);

test('custom role permission controls access to active wisata sub features', function () {
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
