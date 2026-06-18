<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

function adminUserForUserManagementCrud(): User
{
    return User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);
}

it('creates user from admin with verified email', function () {
    $admin = adminUserForUserManagementCrud();

    $this->actingAs($admin)
        ->post('/admin/users', [
            'name' => 'User Created Admin',
            'email' => 'created-admin-user@indotix.test',
            'phone' => '08123456789',
            'gender' => 'male',
            'password' => 'password123',
        ])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('status', 'user-created');

    $user = User::query()->where('email', 'created-admin-user@indotix.test')->firstOrFail();

    expect($user->role)->toBe('user')
        ->and($user->email_verified_at)->not->toBeNull()
        ->and(Hash::check('password123', $user->password))->toBeTrue();
});

it('updates user from admin and keeps email verified without requiring password change', function () {
    $admin = adminUserForUserManagementCrud();
    $user = User::factory()->create([
        'role' => 'user',
        'email' => 'old-user@indotix.test',
        'email_verified_at' => null,
        'password' => 'old-password',
    ]);
    $oldPassword = $user->password;

    $this->actingAs($admin)
        ->put("/admin/users/{$user->id}", [
            'name' => 'User Updated Admin',
            'email' => 'updated-admin-user@indotix.test',
            'phone' => '08987654321',
            'gender' => 'female',
            'password' => '',
        ])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('status', 'user-updated');

    $user->refresh();

    expect($user->name)->toBe('User Updated Admin')
        ->and($user->email)->toBe('updated-admin-user@indotix.test')
        ->and($user->phone)->toBe('08987654321')
        ->and($user->gender)->toBe('female')
        ->and($user->role)->toBe('user')
        ->and($user->email_verified_at)->not->toBeNull()
        ->and($user->password)->toBe($oldPassword);
});

it('does not update admin accounts through user management', function () {
    $admin = adminUserForUserManagementCrud();
    $otherAdmin = adminUserForUserManagementCrud();

    $this->actingAs($admin)
        ->put("/admin/users/{$otherAdmin->id}", [
            'name' => 'Tidak Boleh',
            'email' => 'blocked-admin-update@indotix.test',
            'password' => '',
        ])
        ->assertNotFound();

    expect($otherAdmin->refresh()->email)->not->toBe('blocked-admin-update@indotix.test');
});
