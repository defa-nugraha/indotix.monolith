<?php

use App\Models\AdminAuditLog;
use App\Models\User;
use App\Models\UserActivityLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('admin can view audit logs with useful filters and payload detail', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $otherAdmin = User::factory()->create(['role' => 'admin']);
    $user = User::factory()->create(['role' => 'user']);

    AdminAuditLog::query()->create([
        'admin_id' => $admin->id,
        'action' => 'POST admin/hotels',
        'method' => 'POST',
        'path' => 'admin/hotels',
        'payload' => ['name' => 'Hotel Test'],
        'ip_address' => '127.0.0.1',
        'user_agent' => 'Feature Test',
    ]);

    AdminAuditLog::query()->create([
        'admin_id' => $otherAdmin->id,
        'action' => 'DELETE admin/events/1',
        'method' => 'DELETE',
        'path' => 'admin/events/1',
        'payload' => ['id' => 1],
        'ip_address' => '10.0.0.2',
        'user_agent' => 'Feature Test',
    ]);

    UserActivityLog::query()->create([
        'user_id' => $user->id,
        'role' => 'user',
        'action' => 'POST Hotel booking/confirm',
        'method' => 'POST',
        'path' => 'booking/confirm',
        'payload' => ['booking' => 'Hotel Test User'],
        'ip_address' => '127.0.0.3',
        'user_agent' => 'Feature Test',
    ]);

    $this->actingAs($admin)
        ->get('/admin/system/audit-logs?search=Hotel&method=POST&per_page=25')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/system/audit-logs/index')
            ->where('filters.search', 'Hotel')
            ->where('filters.method', 'POST')
            ->where('summary.total', 3)
            ->where('summary.methods.POST', 2)
            ->where('summary.methods.DELETE', 1)
            ->where('summary.user_logs', 1)
            ->has('actorOptions', 3)
            ->has('roleOptions')
            ->has('methodOptions', 4)
            ->has('logs.data', 2)
        );

    $this->actingAs($admin)
        ->get('/admin/system/audit-logs?source=user&search=Hotel&method=POST&per_page=25')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('logs.data', 1)
            ->where('logs.data.0.source', 'user')
            ->where('logs.data.0.method', 'POST')
            ->where('logs.data.0.path', 'booking/confirm')
            ->where('logs.data.0.actor_name', $user->name)
        );

    $this->actingAs($admin)
        ->get('/admin/system/audit-logs?source=admin&search=Hotel&method=POST&per_page=25')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('logs.data', 1)
            ->where('logs.data.0.source', 'admin')
            ->where('logs.data.0.actor_name', $admin->name)
            ->where('logs.data.0.method', 'POST')
            ->where('logs.data.0.path', 'admin/hotels')
            ->where('logs.data.0.payload.name', 'Hotel Test')
        );
});
