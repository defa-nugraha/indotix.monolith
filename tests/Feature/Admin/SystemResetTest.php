<?php

use App\Models\AdminRole;
use App\Models\User;
use App\Services\SystemResetService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

it('resets operational data while preserving admin accounts', function () {
    Storage::fake('public');

    $admin = User::factory()->create([
        'role' => 'admin',
        'email' => 'admin-reset-test@indotix.test',
        'email_verified_at' => now(),
    ]);
    $user = User::factory()->create([
        'role' => 'user',
        'email' => 'user-reset-test@indotix.test',
        'email_verified_at' => now(),
    ]);

    DB::table('email_otps')->insert([
        'user_id' => $user->id,
        'email' => $user->email,
        'code_hash' => 'hash',
        'expires_at' => now()->addMinutes(10),
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    Storage::disk('public')->put('hotel-images/sample.jpg', 'image');

    $result = app(SystemResetService::class)->reset(['users', 'activity', 'uploads']);

    expect($result['sections'])->toBe(['users', 'activity', 'uploads'])
        ->and($result['tables_reset'])->toBeGreaterThan(0)
        ->and($result['users_deleted'])->toBe(1)
        ->and(User::query()->whereKey($admin->id)->exists())->toBeTrue()
        ->and(User::query()->whereKey($user->id)->exists())->toBeFalse()
        ->and(DB::table('email_otps')->count())->toBe(0)
        ->and(Storage::disk('public')->exists('hotel-images/sample.jpg'))->toBeFalse();
});

it('can reset only selected sections', function () {
    Storage::fake('public');

    $user = User::factory()->create([
        'role' => 'user',
        'email' => 'selective-reset-user@indotix.test',
        'email_verified_at' => now(),
    ]);

    DB::table('email_otps')->insert([
        'user_id' => $user->id,
        'email' => $user->email,
        'code_hash' => 'hash',
        'expires_at' => now()->addMinutes(10),
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    Storage::disk('public')->put('hotel-images/sample.jpg', 'image');

    $result = app(SystemResetService::class)->reset(['activity']);

    expect($result['sections'])->toBe(['activity'])
        ->and($result['users_deleted'])->toBe(0)
        ->and($result['upload_directories_deleted'])->toBe(0)
        ->and(DB::table('email_otps')->count())->toBe(0)
        ->and(User::query()->whereKey($user->id)->exists())->toBeTrue()
        ->and(Storage::disk('public')->exists('hotel-images/sample.jpg'))->toBeTrue();
});

it('blocks system reset for non super admin users', function () {
    $role = AdminRole::query()->create([
        'name' => 'Operator Sistem',
        'slug' => 'operator-sistem',
        'is_active' => true,
    ]);
    $admin = User::factory()->create([
        'role' => 'admin_custom',
        'admin_role_id' => $role->id,
        'email_verified_at' => now(),
    ]);

    $this->actingAs($admin)
        ->post('/admin/system/reset', [
            'confirmation' => 'RESET SISTEM',
            'sections' => ['activity'],
        ])
        ->assertForbidden();
});

it('requires exact reset confirmation text', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);

    $this->actingAs($admin)
        ->post('/admin/system/reset', [
            'confirmation' => 'reset',
            'sections' => ['activity'],
        ])
        ->assertSessionHasErrors('confirmation');
});

it('requires at least one selected section', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);

    $this->actingAs($admin)
        ->post('/admin/system/reset', [
            'confirmation' => 'RESET SISTEM',
            'sections' => [],
        ])
        ->assertSessionHasErrors('sections');
});
