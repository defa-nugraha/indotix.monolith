<?php

use App\Models\AdminPermission;
use App\Models\AdminRole;
use App\Models\Hotel;
use App\Models\MitraWisataOnboarding;
use App\Models\RoomInventory;
use App\Models\RoomType;
use App\Models\SpecialProgram;
use App\Models\SpecialProgramVariant;
use App\Models\User;
use App\Models\WisataTicket;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

function adminOwnedScopeRole(): AdminRole
{
    $role = AdminRole::query()->create([
        'name' => 'Operator Produk Terpisah',
        'slug' => 'operator-produk-terpisah',
        'is_active' => true,
    ]);

    $permissions = collect([
        'hotel_properties',
        'hotel_rooms',
        'wisata_destinations',
        'wisata_tickets',
        'special_programs',
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

test('custom admin product data is scoped to records created by that admin', function () {
    seedOwnedScopeRegion();
    $role = adminOwnedScopeRole();
    $adminA = customProductAdmin($role, 'scope-a@example.test');
    $adminB = customProductAdmin($role, 'scope-b@example.test');

    $hotelA = markOwnedBy(Hotel::query()->create([
        'name' => 'Hotel Milik A',
        'description' => 'A',
        'city_id' => '3273',
        'address' => 'Bandung',
        'status' => 'active',
    ]), $adminA);
    $hotelB = markOwnedBy(Hotel::query()->create([
        'name' => 'Hotel Milik B',
        'description' => 'B',
        'city_id' => '3273',
        'address' => 'Bandung',
        'status' => 'active',
    ]), $adminB);

    $roomA = markOwnedBy(RoomType::query()->create([
        'hotel_id' => $hotelA->id,
        'name' => 'Kamar A',
        'base_price' => 250000,
        'total_rooms' => 5,
        'status' => 'active',
    ]), $adminA);
    $roomB = markOwnedBy(RoomType::query()->create([
        'hotel_id' => $hotelB->id,
        'name' => 'Kamar B',
        'base_price' => 300000,
        'total_rooms' => 5,
        'status' => 'active',
    ]), $adminB);

    markOwnedBy(RoomInventory::query()->create([
        'room_type_id' => $roomA->id,
        'date' => '2026-06-10',
        'available_rooms' => 3,
    ]), $adminA);
    $inventoryB = markOwnedBy(RoomInventory::query()->create([
        'room_type_id' => $roomB->id,
        'date' => '2026-06-10',
        'available_rooms' => 3,
    ]), $adminB);

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
    ]), $adminA);
    $destinationB = markOwnedBy(MitraWisataOnboarding::query()->create([
        'user_id' => $mitraB->id,
        'destination_name' => 'Wisata B',
        'destination_type' => 'alam',
        'city_code' => '3273',
        'verification_status' => 'verified',
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

    $programA = SpecialProgram::query()->create([
        'name' => 'Special A',
        'program_type' => 'promo',
        'status' => 'active',
        'created_by' => $adminA->id,
        'updated_by' => $adminA->id,
    ]);
    $programB = SpecialProgram::query()->create([
        'name' => 'Special B',
        'program_type' => 'promo',
        'status' => 'active',
        'created_by' => $adminB->id,
        'updated_by' => $adminB->id,
    ]);
    SpecialProgramVariant::query()->create([
        'special_program_id' => $programA->id,
        'name' => 'Paket A',
        'price' => 50000,
        'capacity' => 5,
        'created_by' => $adminA->id,
        'updated_by' => $adminA->id,
    ]);
    $variantB = SpecialProgramVariant::query()->create([
        'special_program_id' => $programB->id,
        'name' => 'Paket B',
        'price' => 75000,
        'capacity' => 5,
        'created_by' => $adminB->id,
        'updated_by' => $adminB->id,
    ]);

    $this->actingAs($adminA)
        ->get('/hotels')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('hotels.data', 1)
            ->where('hotels.data.0.name', 'Hotel Milik A'));

    $this->actingAs($adminA)
        ->get('/room-types')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('roomTypes.data', 1)
            ->where('roomTypes.data.0.name', 'Kamar A'));

    $this->actingAs($adminA)
        ->get('/admin/wisata/tickets?search=Wisata B')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('tickets.data', 0));

    $this->actingAs($adminA)
        ->get('/admin/special-programs/tickets')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('tickets.data', 1)
            ->where('tickets.data.0.name', 'Paket A'));

    $this->actingAs($adminA)
        ->get("/hotels/{$hotelB->id}/edit")
        ->assertNotFound();

    $this->actingAs($adminA)
        ->put("/room-types/{$roomA->id}", [
            'hotel_id' => $hotelB->id,
            'name' => 'Kamar A',
            'base_price' => 250000,
            'total_rooms' => 5,
            'status' => 'active',
        ])
        ->assertSessionHasErrors('hotel_id');

    $this->actingAs($adminA)
        ->delete("/room-inventories/bulk", ['ids' => [$inventoryB->id]])
        ->assertRedirect();
    expect(RoomInventory::query()->whereKey($inventoryB->id)->exists())->toBeTrue();

    $this->actingAs($adminA)
        ->put("/admin/special-programs/tickets/{$variantB->id}", [
            'name' => 'Paket B Updated',
            'price' => 80000,
            'quota' => 5,
        ])
        ->assertNotFound();
});

test('super admin can still see product records from all admins', function () {
    seedOwnedScopeRegion();
    $role = adminOwnedScopeRole();
    $adminA = customProductAdmin($role, 'scope-super-a@example.test');
    $adminB = customProductAdmin($role, 'scope-super-b@example.test');
    $superAdmin = User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);

    markOwnedBy(Hotel::query()->create([
        'name' => 'Hotel A Super',
        'description' => 'A',
        'city_id' => '3273',
        'address' => 'Bandung',
        'status' => 'active',
    ]), $adminA);
    markOwnedBy(Hotel::query()->create([
        'name' => 'Hotel B Super',
        'description' => 'B',
        'city_id' => '3273',
        'address' => 'Bandung',
        'status' => 'active',
    ]), $adminB);

    $this->actingAs($superAdmin)
        ->get('/hotels')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('hotels.data', 2));
});
