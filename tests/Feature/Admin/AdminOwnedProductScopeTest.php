<?php

use App\Models\AdminPermission;
use App\Models\AdminRole;
use App\Models\MitraWisataOnboarding;
use App\Models\User;
use App\Models\WisataTicket;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

function adminOwnedScopeRole(): AdminRole
{
    $role = AdminRole::query()->create([
        'name' => 'Operator Wisata Terpisah',
        'slug' => 'operator-wisata-terpisah',
        'is_active' => true,
    ]);

    $permissions = collect([
        'wisata_destinations',
        'wisata_tickets',
    ])->flatMap(fn (string $feature) => collect(['view', 'create', 'update', 'delete'])
        ->map(fn (string $action) => AdminPermission::query()->firstOrCreate(
            ['feature' => $feature, 'action' => $action],
            ['label' => "{$feature}.{$action}"],
        )));

    $role->permissions()->sync($permissions->pluck('id')->all());

    return $role;
}

function customProductAdmin(AdminRole $role, string $email): User
{
    return User::factory()->create([
        'role' => 'admin_custom',
        'admin_role_id' => $role->id,
        'email' => $email,
        'email_verified_at' => now(),
    ]);
}

function seedOwnedScopeRegion(): void
{
    DB::table('provinces')->insertOrIgnore([
        'code' => '32',
        'name' => 'Jawa Barat',
    ]);
    DB::table('regencies')->insertOrIgnore([
        'code' => '3273',
        'province_code' => '32',
        'name' => 'Kota Bandung',
        'type' => 'kota',
    ]);
}

function markOwnedBy($model, User $owner)
{
    $model->forceFill([
        'created_by' => $owner->id,
        'updated_by' => $owner->id,
    ])->save();

    return $model->refresh();
}

test('custom admin wisata product data is scoped to records created by that admin', function () {
    seedOwnedScopeRegion();
    $role = adminOwnedScopeRole();
    $adminA = customProductAdmin($role, 'scope-a@example.test');
    $adminB = customProductAdmin($role, 'scope-b@example.test');

    $mitraA = User::factory()->create([
        'role' => 'mitra',
        'email_verified_at' => now(),
        'created_by' => $adminA->id,
        'updated_by' => $adminA->id,
    ]);
    $mitraB = User::factory()->create([
        'role' => 'mitra',
        'email_verified_at' => now(),
        'created_by' => $adminB->id,
        'updated_by' => $adminB->id,
    ]);

    $destinationA = markOwnedBy(MitraWisataOnboarding::query()->create([
        'user_id' => $mitraA->id,
        'destination_name' => 'Wisata A',
        'destination_type' => 'alam',
        'city_code' => '3273',
        'verification_status' => 'verified',
        'is_suspended' => false,
    ]), $adminA);
    $destinationB = markOwnedBy(MitraWisataOnboarding::query()->create([
        'user_id' => $mitraB->id,
        'destination_name' => 'Wisata B',
        'destination_type' => 'alam',
        'city_code' => '3273',
        'verification_status' => 'verified',
        'is_suspended' => false,
    ]), $adminB);

    markOwnedBy(WisataTicket::query()->create([
        'mitra_wisata_onboarding_id' => $destinationA->id,
        'name' => 'Tiket Wisata A',
        'price' => 100000,
        'quota' => 10,
        'is_active' => true,
    ]), $adminA);
    markOwnedBy(WisataTicket::query()->create([
        'mitra_wisata_onboarding_id' => $destinationB->id,
        'name' => 'Tiket Wisata B',
        'price' => 120000,
        'quota' => 10,
        'is_active' => true,
    ]), $adminB);

    $this->actingAs($adminA)
        ->get('/admin/wisata/destinations')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('destinations.data', 1)
            ->where('destinations.data.0.destination_name', 'Wisata A'));

    $this->actingAs($adminA)
        ->get('/admin/wisata/tickets')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('destinations.data', 1)
            ->where('destinations.data.0.destination_name', 'Wisata A'));

    $this->actingAs($adminA)
        ->get("/admin/wisata/tickets?destination_id={$destinationA->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('selectedDestination.destination_name', 'Wisata A')
            ->has('tickets.data', 1)
            ->where('tickets.data.0.name', 'Tiket Wisata A'));

    $this->actingAs($adminA)
        ->get("/admin/wisata/tickets?destination_id={$destinationB->id}")
        ->assertNotFound();
});

test('retired non wisata admin ownership routes stay unavailable', function (string $method, string $uri) {
    $admin = User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);

    $this->actingAs($admin)
        ->call($method, $uri)
        ->assertNotFound();
})->with([
    ['GET', '/hotels'],
    ['GET', '/room-types'],
    ['GET', '/admin/retail-shop/products'],
    ['GET', '/admin/events/create'],
    ['POST', '/admin/events/organizers'],
    ['GET', '/admin/special-programs/tickets'],
    ['PUT', '/hotels/1'],
]);

test('user converted from mitra wisata to custom role can still see owned wisata data', function () {
    seedOwnedScopeRegion();
    $role = adminOwnedScopeRole();
    $originalAdmin = User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);
    $convertedUser = User::factory()->create([
        'role' => 'mitra',
        'mitra_onboarding_type' => 'wisata',
        'email_verified_at' => now(),
    ]);
    $otherUser = User::factory()->create([
        'role' => 'mitra',
        'mitra_onboarding_type' => 'wisata',
        'email_verified_at' => now(),
    ]);

    $ownedDestination = MitraWisataOnboarding::query()->create([
        'user_id' => $convertedUser->id,
        'destination_name' => 'Wisata Lama Milik User',
        'destination_type' => 'alam',
        'city_code' => '3273',
        'verification_status' => 'verified',
        'is_suspended' => false,
        'created_by' => $originalAdmin->id,
    ]);
    $otherDestination = MitraWisataOnboarding::query()->create([
        'user_id' => $otherUser->id,
        'destination_name' => 'Wisata User Lain',
        'destination_type' => 'alam',
        'city_code' => '3273',
        'verification_status' => 'verified',
        'is_suspended' => false,
        'created_by' => $originalAdmin->id,
    ]);

    WisataTicket::query()->create([
        'mitra_wisata_onboarding_id' => $ownedDestination->id,
        'name' => 'Tiket Lama Milik User',
        'price' => 100000,
        'quota' => 10,
        'is_active' => true,
    ]);
    WisataTicket::query()->create([
        'mitra_wisata_onboarding_id' => $otherDestination->id,
        'name' => 'Tiket User Lain',
        'price' => 120000,
        'quota' => 10,
        'is_active' => true,
    ]);

    $convertedUser->forceFill([
        'role' => 'admin_custom',
        'admin_role_id' => $role->id,
    ])->save();

    $this->actingAs($convertedUser)
        ->get('/admin/wisata/destinations')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('destinations.data', 1)
            ->where('destinations.data.0.destination_name', 'Wisata Lama Milik User'));

    $this->actingAs($convertedUser)
        ->get("/admin/wisata/tickets?destination_id={$ownedDestination->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('selectedDestination.destination_name', 'Wisata Lama Milik User')
            ->has('tickets.data', 1)
            ->where('tickets.data.0.name', 'Tiket Lama Milik User'));

    $this->actingAs($convertedUser)
        ->put("/admin/wisata/destinations/{$ownedDestination->id}", [
            'user_id' => $convertedUser->id,
            'destination_name' => 'Wisata Lama Milik User Updated',
            'destination_type' => 'alam',
            'description' => 'Deskripsi tetap bisa diperbarui.',
            'city_code' => '3273',
            'verification_status' => 'verified',
            'is_live' => true,
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($ownedDestination->refresh()->destination_name)->toBe('Wisata Lama Milik User Updated');
});

test('super admin can update wisata destination owned by non mitra user', function () {
    seedOwnedScopeRegion();
    $owner = User::factory()->create([
        'role' => 'admin_custom',
        'email_verified_at' => now(),
    ]);
    $admin = User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);
    $destination = MitraWisataOnboarding::query()->create([
        'user_id' => $owner->id,
        'destination_name' => 'Wisata Owner Lama',
        'destination_type' => 'alam',
        'city_code' => '3273',
        'verification_status' => 'verified',
        'created_by' => $owner->id,
        'updated_by' => $owner->id,
    ]);

    $this->actingAs($admin)
        ->put("/admin/wisata/destinations/{$destination->id}", [
            'user_id' => $owner->id,
            'destination_name' => 'Wisata Owner Lama Updated',
            'destination_type' => 'alam',
            'city_code' => '3273',
            'verification_status' => 'verified',
            'is_live' => true,
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $destination->refresh();
    expect($destination->destination_name)->toBe('Wisata Owner Lama Updated')
        ->and($destination->user_id)->toBe($owner->id)
        ->and($destination->updated_by)->toBe($admin->id);
});
