<?php

use App\Models\AdminPermission;
use App\Models\AdminRole;
use App\Models\Booking;
use App\Models\Event;
use App\Models\EventBooking;
use App\Models\EventOrganizer;
use App\Models\EventTicket;
use App\Models\Hotel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('custom admin dashboard only summarizes accessible product domains', function () {
    DB::table('provinces')->insert(['code' => '32', 'name' => 'Jawa Barat']);
    DB::table('regencies')->insert([
        'code' => '3273',
        'province_code' => '32',
        'name' => 'Bandung',
        'type' => 'kota',
    ]);

    $role = AdminRole::query()->create([
        'name' => 'Admin Booking Hotel',
        'slug' => 'admin-booking-hotel',
        'is_active' => true,
    ]);
    $permission = AdminPermission::query()->firstOrCreate(
        ['feature' => 'hotel_bookings', 'action' => 'view'],
        ['label' => 'hotel_bookings.view'],
    );
    $role->permissions()->sync([$permission->id]);

    $admin = User::factory()->create([
        'role' => 'admin_custom',
        'admin_role_id' => $role->id,
        'email_verified_at' => now(),
    ]);
    $customer = User::factory()->create(['role' => 'user']);
    $hotel = Hotel::query()->create([
        'vendor_id' => $admin->id,
        'name' => 'Hotel RBAC',
        'city_id' => '3273',
        'address' => 'Bandung',
        'status' => 'published',
    ]);

    Booking::query()->create([
        'user_id' => $customer->id,
        'hotel_id' => $hotel->id,
        'check_in' => now()->toDateString(),
        'check_out' => now()->addDay()->toDateString(),
        'nights' => 1,
        'rooms_count' => 2,
        'guests_count' => 2,
        'subtotal' => 500000,
        'total' => 500000,
        'status' => 'paid',
        'payment_status' => 'paid',
    ]);

    $organizer = EventOrganizer::query()->create([
        'user_id' => $admin->id,
        'name' => 'EO RBAC',
        'status' => 'verified',
    ]);
    $event = Event::query()->create([
        'event_organizer_id' => $organizer->id,
        'event_type' => 'event',
        'title' => 'Event Tidak Boleh Masuk',
        'status' => 'published',
        'capacity_total' => 100,
    ]);
    $ticket = EventTicket::query()->create([
        'event_id' => $event->id,
        'name' => 'Tiket Event',
        'price' => 100000,
        'quota' => 10,
    ]);
    EventBooking::query()->create([
        'user_id' => $customer->id,
        'event_id' => $event->id,
        'event_ticket_id' => $ticket->id,
        'booking_code' => 'EVT-RBAC-DASHBOARD',
        'quantity' => 5,
        'total_price' => 500000,
        'status' => 'paid',
    ]);

    $this->actingAs($admin)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('scope', 'custom')
            ->where('summary.transactions_today', 1)
            ->where('summary.tickets_sold', 2)
            ->where('system.pending_payments', 0));
});
