<?php

use App\Models\AdminRole;
use App\Models\User;
use App\Services\LegacyDatabaseCleanupService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

function cleanupAdminUser(): User
{
    return User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);
}

function cleanupSeedRegion(): void
{
    DB::table('provinces')->insertOrIgnore(['code' => '32', 'name' => 'Jawa Barat']);
    DB::table('regencies')->insertOrIgnore([
        'code' => '3201',
        'province_code' => '32',
        'name' => 'Bogor',
        'type' => 'Kabupaten',
    ]);
}

function cleanupSeedLegacyAndWisataData(): array
{
    cleanupSeedRegion();

    $user = User::factory()->create(['role' => 'user', 'email_verified_at' => now()]);
    $mitra = User::factory()->create(['role' => 'mitra', 'email_verified_at' => now()]);

    $legacyHotelId = DB::table('hotels')->insertGetId([
        'vendor_id' => $mitra->id,
        'name' => 'Legacy Hotel Tanpa Booking',
        'city_id' => '3201',
        'address' => 'Jl. Hotel Lama',
        'status' => 'draft',
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    $legacyRoomTypeId = DB::table('room_types')->insertGetId([
        'hotel_id' => $legacyHotelId,
        'name' => 'Deluxe Lama',
        'base_price' => 100000,
        'total_rooms' => 2,
        'status' => 'draft',
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    DB::table('room_inventories')->insert([
        'room_type_id' => $legacyRoomTypeId,
        'date' => now()->addDay()->toDateString(),
        'available_rooms' => 2,
        'is_closed' => false,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    DB::table('hotel_images')->insert([
        'hotel_id' => $legacyHotelId,
        'image_url' => 'legacy-hotel.jpg',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $bookedHotelId = DB::table('hotels')->insertGetId([
        'vendor_id' => $mitra->id,
        'name' => 'Hotel Dengan Histori',
        'city_id' => '3201',
        'address' => 'Jl. Hotel Histori',
        'status' => 'active',
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    $bookedRoomTypeId = DB::table('room_types')->insertGetId([
        'hotel_id' => $bookedHotelId,
        'name' => 'Kamar Histori',
        'base_price' => 250000,
        'total_rooms' => 1,
        'status' => 'active',
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    $bookingId = DB::table('bookings')->insertGetId([
        'user_id' => $user->id,
        'hotel_id' => $bookedHotelId,
        'check_in' => now()->addDay()->toDateString(),
        'check_out' => now()->addDays(2)->toDateString(),
        'nights' => 1,
        'rooms_count' => 1,
        'guests_count' => 2,
        'subtotal' => 250000,
        'total' => 250000,
        'status' => 'paid',
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    DB::table('booking_rooms')->insert([
        'booking_id' => $bookingId,
        'room_type_id' => $bookedRoomTypeId,
        'rooms_count' => 1,
        'price_per_night' => 250000,
        'subtotal' => 250000,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    DB::table('payments')->insert([
        'booking_id' => $bookingId,
        'provider' => 'midtrans',
        'status' => 'settlement',
        'gross_amount' => 250000,
        'order_id' => 'HOTEL-HISTORY-1',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    DB::table('mitra_onboardings')->insert([
        'user_id' => $mitra->id,
        'current_step' => 3,
        'hotel_name' => 'Onboarding Hotel Lama',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $legacyOrganizerId = DB::table('event_organizers')->insertGetId([
        'user_id' => $mitra->id,
        'name' => 'Organizer Lama',
        'status' => 'pending',
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    $legacyEventId = DB::table('events')->insertGetId([
        'event_organizer_id' => $legacyOrganizerId,
        'event_type' => 'event',
        'title' => 'Event Lama Tanpa Booking',
        'status' => 'draft',
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    DB::table('event_tickets')->insert([
        'event_id' => $legacyEventId,
        'name' => 'Regular Event',
        'price' => 100000,
        'quota' => 20,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    DB::table('event_settings')->insert([
        'booking_timeout_minutes' => 15,
        'max_ticket_per_user' => 4,
        'sales_cutoff_minutes' => 30,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    DB::table('mitra_event_onboardings')->insert([
        'user_id' => $mitra->id,
        'current_step' => 2,
        'eo_name' => 'EO Lama',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $bookedOrganizerId = DB::table('event_organizers')->insertGetId([
        'user_id' => $mitra->id,
        'name' => 'Organizer Histori',
        'status' => 'verified',
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    $bookedEventId = DB::table('events')->insertGetId([
        'event_organizer_id' => $bookedOrganizerId,
        'event_type' => 'event',
        'title' => 'Event Dengan Histori',
        'status' => 'published',
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    $bookedEventTicketId = DB::table('event_tickets')->insertGetId([
        'event_id' => $bookedEventId,
        'name' => 'Ticket Histori',
        'price' => 150000,
        'quota' => 5,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    $eventBookingId = DB::table('event_bookings')->insertGetId([
        'user_id' => $user->id,
        'event_id' => $bookedEventId,
        'event_ticket_id' => $bookedEventTicketId,
        'booking_code' => 'EVT-HISTORY-1',
        'quantity' => 1,
        'total_price' => 150000,
        'status' => 'paid',
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    DB::table('event_payments')->insert([
        'event_booking_id' => $eventBookingId,
        'provider' => 'midtrans',
        'status' => 'settlement',
        'gross_amount' => 150000,
        'order_id' => 'EVENT-HISTORY-1',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $destinationId = DB::table('mitra_wisata_onboardings')->insertGetId([
        'user_id' => $mitra->id,
        'destination_name' => 'Wisata Aktif',
        'destination_type' => 'alam',
        'verification_status' => 'verified',
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    $wisataTicketId = DB::table('wisata_tickets')->insertGetId([
        'mitra_wisata_onboarding_id' => $destinationId,
        'name' => 'Tiket Wisata',
        'price' => 50000,
        'quota' => 10,
        'is_active' => true,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    $wisataBookingId = DB::table('wisata_bookings')->insertGetId([
        'user_id' => $user->id,
        'mitra_wisata_onboarding_id' => $destinationId,
        'wisata_ticket_id' => $wisataTicketId,
        'booking_code' => 'WST-HISTORY-1',
        'visit_date' => now()->addDay()->toDateString(),
        'quantity' => 1,
        'unit_price' => 50000,
        'subtotal_price' => 50000,
        'total_price' => 50000,
        'status' => 'paid',
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    DB::table('wisata_payments')->insert([
        'wisata_booking_id' => $wisataBookingId,
        'provider' => 'midtrans',
        'status' => 'settlement',
        'gross_amount' => 50000,
        'order_id' => 'WISATA-HISTORY-1',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    DB::table('system_settings')->insert([
        ['key' => 'hotel_booking_timeout_minutes', 'value' => '15', 'type' => 'number', 'created_at' => now(), 'updated_at' => now()],
        ['key' => 'event_booking_timeout_minutes', 'value' => '15', 'type' => 'number', 'created_at' => now(), 'updated_at' => now()],
        ['key' => 'wisata_booking_timeout_minutes', 'value' => '20', 'type' => 'number', 'created_at' => now(), 'updated_at' => now()],
    ]);
    DB::table('admin_permissions')->insert([
        ['feature' => 'hotel_properties', 'action' => 'view', 'label' => 'Hotel', 'created_at' => now(), 'updated_at' => now()],
        ['feature' => 'events_items', 'action' => 'view', 'label' => 'Event', 'created_at' => now(), 'updated_at' => now()],
        ['feature' => 'wisata_destinations', 'action' => 'view', 'label' => 'Wisata', 'created_at' => now(), 'updated_at' => now()],
    ]);

    return compact(
        'legacyHotelId',
        'bookedHotelId',
        'bookingId',
        'legacyEventId',
        'bookedEventId',
        'eventBookingId',
        'destinationId',
        'wisataTicketId',
        'wisataBookingId'
    );
}

test('legacy database cleanup command requires valid main admin audit identity', function () {
    $role = AdminRole::query()->create([
        'name' => 'Operator',
        'slug' => 'operator',
        'is_active' => true,
    ]);
    $customAdmin = User::factory()->create([
        'role' => 'admin_custom',
        'admin_role_id' => $role->id,
        'email_verified_at' => now(),
    ]);
    $user = User::factory()->create(['role' => 'user', 'email_verified_at' => now()]);
    $mitra = User::factory()->create(['role' => 'mitra', 'email_verified_at' => now()]);

    expect(Artisan::call('indotix:cleanup-legacy-database', [
        '--mode' => 'preview',
        '--json' => true,
    ]))->toBe(1)
        ->and(Artisan::call('indotix:cleanup-legacy-database', [
        '--mode' => 'preview',
        '--admin-id' => $user->id,
        '--json' => true,
    ]))->toBe(1)
        ->and(Artisan::call('indotix:cleanup-legacy-database', [
            '--mode' => 'preview',
            '--admin-id' => $mitra->id,
            '--json' => true,
        ]))->toBe(1)
        ->and(Artisan::call('indotix:cleanup-legacy-database', [
            '--mode' => 'preview',
            '--admin-id' => $customAdmin->id,
            '--json' => true,
        ]))->toBe(1);

    expect(Artisan::call('indotix:cleanup-legacy-database', [
        '--mode' => 'preview',
        '--admin-id' => cleanupAdminUser()->id,
        '--json' => true,
    ]))->toBe(0);
});

test('legacy database cleanup preview does not mutate data', function () {
    $admin = cleanupAdminUser();
    $ids = cleanupSeedLegacyAndWisataData();

    expect(Artisan::call('indotix:cleanup-legacy-database', [
        '--mode' => 'preview',
        '--admin-id' => $admin->id,
        '--json' => true,
    ]))->toBe(0);

    $result = json_decode(Artisan::output(), true);

    expect($result)
        ->toHaveKeys(['cleanup_plan_id', 'summary', 'cleanup_plan'])
        ->and($result['mode'])->toBe('preview');

    expect(DB::table('hotels')->where('id', $ids['legacyHotelId'])->exists())->toBeTrue()
        ->and(DB::table('events')->where('id', $ids['legacyEventId'])->exists())->toBeTrue()
        ->and(DB::table('wisata_bookings')->where('id', $ids['wisataBookingId'])->exists())->toBeTrue();
});

test('legacy database cleanup execute requires confirmation plan and environment flag', function () {
    $admin = cleanupAdminUser();

    expect(Artisan::call('indotix:cleanup-legacy-database', [
        '--mode' => 'invalid',
        '--json' => true,
    ]))->toBe(1);

    expect(Artisan::call('indotix:cleanup-legacy-database', [
        '--mode' => 'execute',
        '--json' => true,
    ]))->toBe(1);

    Artisan::call('indotix:cleanup-legacy-database', [
        '--mode' => 'preview',
        '--admin-id' => $admin->id,
        '--json' => true,
    ]);
    $preview = json_decode(Artisan::output(), true);

    expect(Artisan::call('indotix:cleanup-legacy-database', [
        '--mode' => 'execute',
        '--plan-id' => $preview['cleanup_plan_id'],
        '--confirmation' => 'WRONG',
        '--admin-id' => $admin->id,
        '--json' => true,
    ]))->toBe(1);

    config(['app.allow_database_cleanup' => false]);
    expect(Artisan::call('indotix:cleanup-legacy-database', [
        '--mode' => 'execute',
        '--plan-id' => $preview['cleanup_plan_id'],
        '--confirmation' => LegacyDatabaseCleanupService::CONFIRMATION,
        '--admin-id' => $admin->id,
        '--json' => true,
    ]))->toBe(1);
});

test('legacy database cleanup executes safely and preserves wisata and financial history', function () {
    Storage::fake('local');
    config(['app.allow_database_cleanup' => true]);

    $admin = cleanupAdminUser();
    $ids = cleanupSeedLegacyAndWisataData();

    expect(Artisan::call('indotix:cleanup-legacy-database', [
        '--mode' => 'preview',
        '--admin-id' => $admin->id,
        '--json' => true,
    ]))->toBe(0);
    $preview = json_decode(Artisan::output(), true);

    expect(Artisan::call('indotix:cleanup-legacy-database', [
        '--mode' => 'execute',
        '--plan-id' => $preview['cleanup_plan_id'],
        '--confirmation' => LegacyDatabaseCleanupService::CONFIRMATION,
        '--admin-id' => $admin->id,
        '--json' => true,
    ]))->toBe(0);
    $result = json_decode(Artisan::output(), true);

    expect($result['mode'])->toBe('execute');

    expect(DB::table('hotels')->where('id', $ids['legacyHotelId'])->exists())->toBeFalse()
        ->and(DB::table('hotels')->where('id', $ids['bookedHotelId'])->exists())->toBeTrue()
        ->and(DB::table('bookings')->where('id', $ids['bookingId'])->exists())->toBeTrue()
        ->and(DB::table('payments')->where('order_id', 'HOTEL-HISTORY-1')->exists())->toBeTrue()
        ->and(DB::table('events')->where('id', $ids['legacyEventId'])->exists())->toBeFalse()
        ->and(DB::table('events')->where('id', $ids['bookedEventId'])->exists())->toBeTrue()
        ->and(DB::table('event_bookings')->where('id', $ids['eventBookingId'])->exists())->toBeTrue()
        ->and(DB::table('event_payments')->where('order_id', 'EVENT-HISTORY-1')->exists())->toBeTrue()
        ->and(DB::table('mitra_wisata_onboardings')->where('id', $ids['destinationId'])->exists())->toBeTrue()
        ->and(DB::table('wisata_tickets')->where('id', $ids['wisataTicketId'])->exists())->toBeTrue()
        ->and(DB::table('wisata_bookings')->where('id', $ids['wisataBookingId'])->exists())->toBeTrue()
        ->and(DB::table('wisata_payments')->where('order_id', 'WISATA-HISTORY-1')->exists())->toBeTrue()
        ->and(DB::table('system_settings')->where('key', 'hotel_booking_timeout_minutes')->exists())->toBeFalse()
        ->and(DB::table('system_settings')->where('key', 'event_booking_timeout_minutes')->exists())->toBeFalse()
        ->and(DB::table('system_settings')->where('key', 'wisata_booking_timeout_minutes')->exists())->toBeTrue()
        ->and(DB::table('admin_permissions')->where('feature', 'hotel_properties')->exists())->toBeFalse()
        ->and(DB::table('admin_permissions')->where('feature', 'events_items')->exists())->toBeFalse()
        ->and(DB::table('admin_permissions')->where('feature', 'wisata_destinations')->exists())->toBeTrue();

    Storage::disk('local')->assertExists($result['summary']['backup_path']);

    expect(Artisan::call('indotix:cleanup-legacy-database', [
        '--mode' => 'preview',
        '--admin-id' => $admin->id,
        '--json' => true,
    ]))->toBe(0);
    $secondPreview = json_decode(Artisan::output(), true);

    expect(Artisan::call('indotix:cleanup-legacy-database', [
        '--mode' => 'execute',
        '--plan-id' => $secondPreview['cleanup_plan_id'],
        '--confirmation' => LegacyDatabaseCleanupService::CONFIRMATION,
        '--admin-id' => $admin->id,
        '--json' => true,
    ]))->toBe(0);
    $secondResult = json_decode(Artisan::output(), true);

    expect($secondResult['summary']['records_deleted'])->toBe(0);
});

test('legacy database cleanup rolls back when an operation fails', function () {
    Storage::fake('local');
    config(['app.allow_database_cleanup' => true]);

    $admin = cleanupAdminUser();
    $ids = cleanupSeedLegacyAndWisataData();

    $service = new class extends LegacyDatabaseCleanupService {
        protected function afterOperation(string $key, int $affected): void
        {
            if ($affected > 0) {
                throw new RuntimeException('Simulated cleanup failure.');
            }
        }
    };

    $preview = $service->preview($admin->id);

    expect(fn () => $service->execute($preview['cleanup_plan_id'], $admin->id))
        ->toThrow(RuntimeException::class);

    expect(DB::table('hotels')->where('id', $ids['legacyHotelId'])->exists())->toBeTrue()
        ->and(DB::table('events')->where('id', $ids['legacyEventId'])->exists())->toBeTrue()
        ->and(DB::table('wisata_bookings')->where('id', $ids['wisataBookingId'])->exists())->toBeTrue();
});
