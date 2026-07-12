<?php

use App\Models\Event;
use App\Models\EventOrganizer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('admin events index supports complete filters', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);

    $organizer = EventOrganizer::query()->create([
        'user_id' => $admin->id,
        'name' => 'Organizer Utama',
        'email' => $admin->email,
        'status' => 'verified',
    ]);

    Event::query()->create([
        'event_organizer_id' => $organizer->id,
        'event_type' => 'event',
        'title' => 'Indotix Fun Run',
        'location' => 'Jakarta',
        'start_at' => '2026-07-14 08:00:00',
        'end_at' => '2026-07-14 12:00:00',
        'status' => 'published',
        'capacity_total' => 100,
        'capacity_sold' => 30,
    ]);

    Event::query()->create([
        'event_organizer_id' => $organizer->id,
        'event_type' => 'event',
        'title' => 'Event Sold Out',
        'location' => 'Bandung',
        'start_at' => '2026-08-10 08:00:00',
        'end_at' => '2026-08-10 12:00:00',
        'status' => 'published',
        'capacity_total' => 50,
        'capacity_sold' => 50,
    ]);

    $this->actingAs($admin)
        ->get('/admin/events?q=Fun&status=published&capacity_state=available&date_from=2026-07-01&date_to=2026-07-31')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/events/index')
            ->where('filters.q', 'Fun')
            ->where('filters.status', 'published')
            ->where('filters.capacity_state', 'available')
            ->has('events.data', 1)
            ->where('events.data.0.title', 'Indotix Fun Run'));
});
