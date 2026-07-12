<?php

use App\Models\AdminPermission;
use App\Models\AdminRole;
use App\Models\Event;
use App\Models\EventOrganizer;
use App\Models\Hotel;
use App\Models\MitraEventOnboarding;
use App\Models\MitraWisataOnboarding;
use App\Models\RoomInventory;
use App\Models\RoomType;
use App\Models\SpecialProgram;
use App\Models\SpecialProgramVariant;
use App\Models\SouvenirProduct;
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
        'special_program_tickets',
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

test('custom admin retail product data is scoped to records created by that admin', function () {
    $role = AdminRole::query()->create([
        'name' => 'Operator Retail',
        'slug' => 'operator-retail',
        'is_active' => true,
    ]);

    $permissions = collect(['retail_products', 'retail_inventory'])
        ->flatMap(fn (string $feature) => collect(['view', 'create', 'update', 'delete'])
            ->map(fn (string $action) => AdminPermission::query()->firstOrCreate(
                ['feature' => $feature, 'action' => $action],
                ['label' => "{$feature}.{$action}"],
            )));
    $role->permissions()->sync($permissions->pluck('id')->all());

    $adminA = customProductAdmin($role, 'retail-a@example.test');
    $adminB = customProductAdmin($role, 'retail-b@example.test');

    SouvenirProduct::query()->create([
        'name' => 'Produk Retail A',
        'slug' => 'produk-retail-a',
        'sku' => 'RET-A',
        'price' => 10000,
        'status' => 'active',
        'is_active' => true,
        'stock' => 5,
        'created_by' => $adminA->id,
        'updated_by' => $adminA->id,
    ]);
    $productB = SouvenirProduct::query()->create([
        'name' => 'Produk Retail B',
        'slug' => 'produk-retail-b',
        'sku' => 'RET-B',
        'price' => 12000,
        'status' => 'active',
        'is_active' => true,
        'stock' => 7,
        'created_by' => $adminB->id,
        'updated_by' => $adminB->id,
    ]);

    $this->actingAs($adminA)
        ->get('/admin/retail-shop/products')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('products.data', 1)
            ->where('products.data.0.name', 'Produk Retail A'));

    $this->actingAs($adminA)
        ->put("/admin/retail-shop/products/{$productB->id}", [
            'name' => 'Produk Retail B Updated',
            'sku' => 'RET-B',
            'price' => 12000,
            'status' => 'active',
        ])
        ->assertNotFound();
});

test('custom admin can create event with an automatically owned organizer', function () {
    $role = AdminRole::query()->create([
        'name' => 'Operator Event',
        'slug' => 'operator-event',
        'is_active' => true,
    ]);

    $permissions = collect(['view', 'create'])
        ->map(fn (string $action) => AdminPermission::query()->firstOrCreate(
            ['feature' => 'events_items', 'action' => $action],
            ['label' => "events_items.{$action}"],
        ));
    $role->permissions()->sync($permissions->pluck('id')->all());

    $admin = customProductAdmin($role, 'event-rbac@example.test');

    expect(EventOrganizer::query()->where('user_id', $admin->id)->exists())->toBeFalse();

    $this->actingAs($admin)
        ->get('/admin/events/create')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('organizerOptions', 1)
            ->where('organizerOptions.0.name', $admin->name));

    $organizer = EventOrganizer::query()->where('user_id', $admin->id)->firstOrFail();

    expect($organizer->status)->toBe('verified');

    $this->actingAs($admin)
        ->post('/admin/events', [
            'title' => 'Event RBAC Baru',
            'description' => 'Event dibuat oleh akun RBAC.',
            'city_code' => null,
            'location' => 'Bandung',
            'address' => 'Jl. Asia Afrika',
            'start_at' => '2026-07-01 10:00:00',
            'end_at' => '2026-07-01 12:00:00',
            'capacity_total' => 100,
            'status' => 'draft',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $event = Event::query()->where('title', 'Event RBAC Baru')->firstOrFail();

    expect($event->event_organizer_id)->toBe($organizer->id)
        ->and($event->organizer?->user_id)->toBe($admin->id);
});

test('custom admin can create and view only their own event organizer', function () {
    $role = AdminRole::query()->create([
        'name' => 'Operator Organizer Event',
        'slug' => 'operator-organizer-event',
        'is_active' => true,
    ]);

    $permissions = collect(['view', 'create'])
        ->map(fn (string $action) => AdminPermission::query()->firstOrCreate(
            ['feature' => 'events_items', 'action' => $action],
            ['label' => "events_items.{$action}"],
        ));
    $role->permissions()->sync($permissions->pluck('id')->all());

    $adminA = customProductAdmin($role, 'organizer-a@example.test');
    $adminB = customProductAdmin($role, 'organizer-b@example.test');

    $organizerB = EventOrganizer::query()->create([
        'user_id' => $adminB->id,
        'name' => 'Organizer B',
        'email' => 'organizer-b@example.test',
        'status' => 'verified',
    ]);

    $this->actingAs($adminA)
        ->post('/admin/events/organizers', [
            'name' => 'Penanggung Jawab A',
            'email' => 'eo-a@example.test',
            'phone' => '081234567890',
            'eo_name' => 'Organizer A',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $organizerA = EventOrganizer::query()->where('user_id', $adminA->id)->firstOrFail();

    expect($organizerA->name)->toBe('Organizer A')
        ->and($organizerA->email)->toBe('eo-a@example.test')
        ->and($organizerA->status)->toBe('verified')
        ->and(MitraEventOnboarding::query()
            ->where('user_id', $adminA->id)
            ->where('verification_status', 'verified')
            ->exists())->toBeTrue();

    $this->actingAs($adminA)
        ->get('/admin/events/organizers')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('canManageMitraEvent', false)
            ->has('organizers.data', 1)
            ->where('organizers.data.0.name', 'Organizer A'));

    $this->actingAs($adminA)
        ->get("/admin/events/organizers/{$organizerB->id}")
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
        ->get('/admin/wisata/tickets')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
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

test('super admin can update special program owned by any user and records updater', function () {
    $owner = User::factory()->create([
        'role' => 'user',
        'email_verified_at' => now(),
    ]);
    $admin = User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);
    $program = SpecialProgram::query()->create([
        'name' => 'Program Milik User',
        'program_type' => 'package',
        'category' => 'meeting',
        'base_price' => 100000,
        'capacity' => 10,
        'status' => 'draft',
        'is_active' => false,
        'created_by' => $owner->id,
    ]);

    $this->actingAs($admin)
        ->post("/admin/special-programs/{$program->id}", [
            '_method' => 'PUT',
            'created_by' => $owner->id,
            'name' => 'Program Milik User Updated',
            'category' => 'meeting',
            'base_price' => 150000,
            'description' => 'Diperbarui oleh admin utama.',
            'capacity' => 12,
            'is_active' => true,
            'variants' => [],
            'facilities' => ['Fasilitas admin'],
            'inventories' => [],
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $program->refresh();
    expect($program->name)->toBe('Program Milik User Updated')
        ->and($program->created_by)->toBe($owner->id)
        ->and($program->updated_by)->toBe($admin->id);
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

test('super admin can update hotel owned by non mitra vendor', function () {
    seedOwnedScopeRegion();
    $owner = User::factory()->create([
        'role' => 'admin_custom',
        'email_verified_at' => now(),
    ]);
    $admin = User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);
    $hotel = markOwnedBy(Hotel::query()->create([
        'vendor_id' => $owner->id,
        'name' => 'Hotel Owner Lama',
        'description' => 'Sebelum update',
        'city_id' => '3273',
        'address' => 'Bandung',
        'status' => 'active',
    ]), $owner);

    $this->actingAs($admin)
        ->put("/hotels/{$hotel->id}", [
            'vendor_id' => $owner->id,
            'name' => 'Hotel Owner Lama Updated',
            'description' => 'Diubah admin utama.',
            'city_id' => '3273',
            'address' => 'Bandung',
            'status' => 'active',
            'facility_codes' => [],
            'taxes' => [],
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $hotel->refresh();
    expect($hotel->name)->toBe('Hotel Owner Lama Updated')
        ->and($hotel->vendor_id)->toBe($owner->id)
        ->and($hotel->updated_by)->toBe($admin->id);
});
