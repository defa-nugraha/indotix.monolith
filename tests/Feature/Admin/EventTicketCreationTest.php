<?php

use App\Models\AdminPermission;
use App\Models\AdminRole;
use App\Models\Event;
use App\Models\EventAuditLog;
use App\Models\EventBooking;
use App\Models\EventOrganizer;
use App\Models\EventTicket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

function eventTicketOrganizer(User $user, string $name): EventOrganizer
{
    return EventOrganizer::query()->create([
        'user_id' => $user->id,
        'name' => $name,
        'email' => $user->email,
        'status' => 'verified',
    ]);
}

function eventForTicket(EventOrganizer $organizer, string $title): Event
{
    return Event::query()->create([
        'event_organizer_id' => $organizer->id,
        'event_type' => 'event',
        'title' => $title,
        'start_at' => '2026-07-10 09:00:00',
        'end_at' => '2026-07-10 18:00:00',
        'status' => 'draft',
        'capacity_total' => 200,
    ]);
}

test('super admin can create an event ticket from the admin web app', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);
    $event = eventForTicket(eventTicketOrganizer($admin, 'INDOTIX Event'), 'Festival INDOTIX');

    $this->actingAs($admin)
        ->get('/admin/events/tickets/create')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/events/tickets/create')
            ->where('canCreateEvent', true)
            ->has('events', 1)
            ->where('events.0.title', 'Festival INDOTIX'));

    $this->actingAs($admin)
        ->post('/admin/events/tickets', [
            'event_id' => $event->id,
            'name' => 'Tiket VIP',
            'description' => 'Akses area VIP.',
            'price' => 350000,
            'quota' => 50,
            'max_per_user' => 4,
            'benefits' => ['VIP lounge', 'Merchandise'],
            'is_active' => true,
        ])
        ->assertRedirect("/admin/events/tickets?event_id={$event->id}")
        ->assertSessionHasNoErrors();

    $ticket = EventTicket::query()->where('event_id', $event->id)->firstOrFail();

    expect($ticket->name)->toBe('Tiket VIP')
        ->and((int) $ticket->price)->toBe(350000)
        ->and($ticket->quota)->toBe(50)
        ->and($ticket->benefits)->toBe(['VIP lounge', 'Merchandise'])
        ->and($ticket->is_active)->toBeTrue()
        ->and(EventAuditLog::query()
            ->where('action', 'event_ticket_created')
            ->where('subject_id', $ticket->id)
            ->exists())->toBeTrue();
});

test('custom admin can only create tickets for their own events', function () {
    $role = AdminRole::query()->create([
        'name' => 'Operator Tiket Event',
        'slug' => 'operator-tiket-event',
        'is_active' => true,
    ]);
    $permissions = collect(['view', 'create'])
        ->map(fn (string $action) => AdminPermission::query()->firstOrCreate(
            ['feature' => 'events_tickets', 'action' => $action],
            ['label' => "events_tickets.{$action}"],
        ));
    $role->permissions()->sync($permissions->pluck('id')->all());

    $admin = User::factory()->create([
        'role' => 'admin_custom',
        'admin_role_id' => $role->id,
        'email_verified_at' => now(),
    ]);
    $otherAdmin = User::factory()->create([
        'role' => 'admin_custom',
        'admin_role_id' => $role->id,
        'email_verified_at' => now(),
    ]);
    $ownEvent = eventForTicket(eventTicketOrganizer($admin, 'Organizer Sendiri'), 'Event Sendiri');
    $otherEvent = eventForTicket(eventTicketOrganizer($otherAdmin, 'Organizer Lain'), 'Event Lain');

    $this->actingAs($admin)
        ->get('/admin/events/tickets/create')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('events', 1)
            ->where('events.0.id', $ownEvent->id));

    $this->actingAs($admin)
        ->post('/admin/events/tickets', [
            'event_id' => $otherEvent->id,
            'name' => 'Tiket Tidak Sah',
            'price' => 100000,
            'quota' => 10,
            'max_per_user' => 2,
            'benefits' => [],
            'is_active' => true,
        ])
        ->assertNotFound();

    expect(EventTicket::query()->where('event_id', $otherEvent->id)->exists())->toBeFalse();
});

test('super admin can edit an event ticket with rupiah integer value', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);
    $event = eventForTicket(eventTicketOrganizer($admin, 'Organizer Edit'), 'Event Edit');
    $ticket = EventTicket::query()->create([
        'event_id' => $event->id,
        'name' => 'Tiket Lama',
        'price' => 125000,
        'quota' => 25,
        'max_per_user' => 2,
        'benefits' => [],
        'is_active' => true,
    ]);

    $this->actingAs($admin)
        ->get("/admin/events/tickets/{$ticket->id}/edit")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/events/tickets/create')
            ->where('ticket.id', $ticket->id)
            ->where('ticket.price', 125000));

    $this->actingAs($admin)
        ->put("/admin/events/tickets/{$ticket->id}", [
            'event_id' => $event->id,
            'name' => 'Tiket Premium',
            'description' => 'Tiket setelah diperbarui.',
            'price' => 275000,
            'quota' => 40,
            'max_per_user' => 3,
            'benefits' => ['Merchandise'],
            'is_active' => false,
        ])
        ->assertRedirect("/admin/events/tickets?event_id={$event->id}")
        ->assertSessionHasNoErrors();

    expect($ticket->refresh()->name)->toBe('Tiket Premium')
        ->and((int) $ticket->price)->toBe(275000)
        ->and($ticket->quota)->toBe(40)
        ->and($ticket->is_active)->toBeFalse()
        ->and(EventAuditLog::query()
            ->where('action', 'event_ticket_updated')
            ->where('subject_id', $ticket->id)
            ->exists())->toBeTrue();
});

test('super admin can delete an unused ticket but cannot delete a booked ticket', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);
    $customer = User::factory()->create([
        'role' => 'user',
        'email_verified_at' => now(),
    ]);
    $event = eventForTicket(eventTicketOrganizer($admin, 'Organizer Delete'), 'Event Delete');
    $unusedTicket = EventTicket::query()->create([
        'event_id' => $event->id,
        'name' => 'Tiket Belum Terjual',
        'price' => 100000,
        'quota' => 10,
        'max_per_user' => 2,
        'is_active' => true,
    ]);
    $bookedTicket = EventTicket::query()->create([
        'event_id' => $event->id,
        'name' => 'Tiket Sudah Terjual',
        'price' => 150000,
        'quota' => 10,
        'max_per_user' => 2,
        'is_active' => true,
    ]);
    EventBooking::query()->create([
        'user_id' => $customer->id,
        'event_id' => $event->id,
        'event_ticket_id' => $bookedTicket->id,
        'booking_code' => 'EVT-DELETE-001',
        'quantity' => 1,
        'total_price' => 150000,
        'status' => 'paid',
    ]);

    $this->actingAs($admin)
        ->delete("/admin/events/tickets/{$unusedTicket->id}")
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect(EventTicket::query()->whereKey($unusedTicket->id)->exists())->toBeFalse()
        ->and(EventAuditLog::query()
            ->where('action', 'event_ticket_deleted')
            ->where('subject_id', $unusedTicket->id)
            ->exists())->toBeTrue();

    $this->actingAs($admin)
        ->delete("/admin/events/tickets/{$bookedTicket->id}")
        ->assertRedirect()
        ->assertSessionHasErrors('ticket');

    expect(EventTicket::query()->whereKey($bookedTicket->id)->exists())->toBeTrue();
});
