<?php

use App\Models\AdminPermission;
use App\Models\AdminRole;
use App\Models\MitraEventOnboarding;
use App\Models\MitraOnboarding;
use App\Models\MitraWisataOnboarding;
use App\Models\User;
use App\Support\AdminPermissionRegistry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

uses(RefreshDatabase::class);

function accessMatrixUser(string $role, array $attributes = []): User
{
    return User::factory()->create(array_merge([
        'role' => $role,
        'email_verified_at' => now(),
    ], $attributes));
}

function accessMatrixPermission(string $feature, string $action): AdminPermission
{
    return AdminPermission::query()->firstOrCreate(
        ['feature' => $feature, 'action' => $action],
        ['label' => "{$feature}.{$action}"],
    );
}

function accessMatrixCustomAdmin(array $permissionKeys, bool $active = true): User
{
    $role = AdminRole::query()->create([
        'name' => 'Role Matrix '.str()->random(6),
        'slug' => 'role-matrix-'.str()->random(8),
        'is_active' => $active,
    ]);

    $permissions = collect($permissionKeys)
        ->map(function (string $permissionKey) {
            [$feature, $action] = explode('.', $permissionKey, 2);

            return accessMatrixPermission($feature, $action);
        });

    $role->permissions()->sync($permissions->pluck('id')->all());

    return accessMatrixUser('admin_custom', ['admin_role_id' => $role->id]);
}

function accessMatrixVerifiedHotelMitra(): User
{
    $user = accessMatrixUser('mitra', ['mitra_onboarding_type' => 'hotel']);

    MitraOnboarding::query()->create([
        'user_id' => $user->id,
        'current_step' => 3,
        'verification_status' => 'verified',
        'payout_status' => 'verified',
    ]);

    return $user;
}

function accessMatrixVerifiedWisataMitra(): User
{
    $user = accessMatrixUser('mitra', ['mitra_onboarding_type' => 'wisata']);

    MitraWisataOnboarding::query()->create([
        'user_id' => $user->id,
        'current_step' => 3,
        'verification_status' => 'verified',
        'payout_status' => 'verified',
    ]);

    return $user;
}

function accessMatrixVerifiedEventMitra(): User
{
    $user = accessMatrixUser('mitra', ['mitra_onboarding_type' => 'event']);

    MitraEventOnboarding::query()->create([
        'user_id' => $user->id,
        'current_step' => 4,
        'verification_status' => 'verified',
    ]);

    return $user;
}

function accessMatrixResolvedPermission(string $method, string $uri): ?array
{
    $request = Request::create($uri, $method);
    $route = Route::getRoutes()->match($request);
    $request->setRouteResolver(fn () => $route);

    return AdminPermissionRegistry::resolveRequest($request);
}

it('blocks non admin roles from admin and root admin hotel management routes', function (string $role) {
    $user = accessMatrixUser($role, [
        'mitra_onboarding_type' => $role === 'mitra' ? 'hotel' : null,
    ]);

    foreach ([
        '/admin/users',
        '/admin/system/roles',
        '/admin/wisata/destinations',
        '/admin/events',
        '/admin/retail-shop/products',
        '/hotels',
        '/hotels/create',
        '/room-types',
        '/room-inventories',
    ] as $url) {
        $response = $this->actingAs($user)->get($url);

        expect($response->getStatusCode(), "{$role} must not receive HTTP 200 for {$url}")
            ->not->toBe(200);
    }
})->with([
    'customer user' => 'user',
    'hotel partner' => 'mitra',
]);

it('enforces custom rbac crud actions on root hotel management routes', function () {
    $viewOnly = accessMatrixCustomAdmin(['hotel_properties.view']);

    $this->actingAs($viewOnly)
        ->get('/hotels')
        ->assertOk();

    $this->actingAs($viewOnly)
        ->get('/hotels/create')
        ->assertForbidden();

    $this->actingAs($viewOnly)
        ->get('/room-types')
        ->assertForbidden();

    $creator = accessMatrixCustomAdmin(['hotel_properties.view', 'hotel_properties.create']);

    $this->actingAs($creator)
        ->get('/hotels/create')
        ->assertOk();
});

it('keeps legacy product admins inside their product boundaries', function () {
    $academyAdmin = accessMatrixUser('admin_academy');
    $retailAdmin = accessMatrixUser('admin_retail');
    $specialProgramAdmin = accessMatrixUser('admin_special_program');

    $this->actingAs($academyAdmin)->get('/admin/academy/classes')->assertOk();
    $this->actingAs($academyAdmin)->get('/admin/retail-shop/products')->assertRedirect('/dashboard');
    $this->actingAs($academyAdmin)->get('/admin/special-programs')->assertRedirect('/dashboard');

    $this->actingAs($retailAdmin)->get('/admin/retail-shop/products')->assertOk();
    $this->actingAs($retailAdmin)->get('/admin/academy/classes')->assertRedirect('/dashboard');
    $this->actingAs($retailAdmin)->get('/admin/special-programs')->assertRedirect('/dashboard');

    $this->actingAs($specialProgramAdmin)->get('/admin/special-programs')->assertOk();
    $this->actingAs($specialProgramAdmin)->get('/admin/academy/classes')->assertRedirect('/dashboard');
    $this->actingAs($specialProgramAdmin)->get('/admin/retail-shop/products')->assertRedirect('/dashboard');
});

it('keeps mitra product routes isolated by onboarding type', function () {
    $hotelMitra = accessMatrixVerifiedHotelMitra();
    $wisataMitra = accessMatrixVerifiedWisataMitra();
    $eventMitra = accessMatrixVerifiedEventMitra();

    $this->actingAs($hotelMitra)->get('/mitra/hotels')->assertOk();
    $this->actingAs($hotelMitra)->get('/mitra/wisata/tickets')->assertRedirect('/mitra/dashboard');
    $this->actingAs($hotelMitra)->get('/mitra/events')->assertRedirect('/mitra/dashboard');

    $this->actingAs($wisataMitra)->get('/mitra/wisata/tickets')->assertOk();
    $this->actingAs($wisataMitra)->get('/mitra/hotels')->assertRedirect('/mitra/dashboard');
    $this->actingAs($wisataMitra)->get('/mitra/events')->assertRedirect('/mitra/dashboard');

    $this->actingAs($eventMitra)->get('/mitra/events')->assertOk();
    $this->actingAs($eventMitra)->get('/mitra/hotels')->assertRedirect('/mitra/dashboard');
    $this->actingAs($eventMitra)->get('/mitra/wisata/tickets')->assertRedirect('/mitra/dashboard');
});

it('maps sensitive state changing admin routes to update permissions', function () {
    expect(accessMatrixResolvedPermission('POST', '/admin/events/1/capacity'))
        ->toMatchArray(['feature' => 'events_items', 'action' => 'update']);

    expect(accessMatrixResolvedPermission('POST', '/admin/events/bookings/1/refund'))
        ->toMatchArray(['feature' => 'events_bookings', 'action' => 'update']);
});
