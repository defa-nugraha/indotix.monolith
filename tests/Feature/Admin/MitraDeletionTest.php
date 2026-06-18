<?php

use App\Models\Booking;
use App\Models\Event;
use App\Models\EventBooking;
use App\Models\EventCommission;
use App\Models\EventDispute;
use App\Models\EventOrganizer;
use App\Models\EventSettlement;
use App\Models\EventTicket;
use App\Models\Hotel;
use App\Models\HotelImage;
use App\Models\MitraEventOnboarding;
use App\Models\MitraEventStaff;
use App\Models\MitraOnboarding;
use App\Models\MitraWisataOnboarding;
use App\Models\MitraWisataStaff;
use App\Models\Payout;
use App\Models\RoomImage;
use App\Models\RoomType;
use App\Models\User;
use App\Models\Voucher;
use App\Models\WisataAffiliate;
use App\Models\WisataAffiliateCommission;
use App\Models\WisataBooking;
use App\Models\WisataCommissionRule;
use App\Models\WisataDispute;
use App\Models\WisataPayout;
use App\Models\WisataReview;
use App\Models\WisataTicket;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

function adminUserForMitraDeletion(): User
{
    return User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);
}

function seedRegionForMitraDeletion(): void
{
    DB::table('provinces')->insertOrIgnore([
        'code' => '32',
        'name' => 'Jawa Barat',
    ]);
    DB::table('regencies')->insertOrIgnore([
        'code' => '3273',
        'province_code' => '32',
        'name' => 'Bandung',
        'type' => 'kota',
    ]);
}

it('deletes hotel mitra with related data and uploaded files', function () {
    Storage::fake('public');
    seedRegionForMitraDeletion();

    $admin = adminUserForMitraDeletion();
    $mitra = User::factory()->create([
        'role' => 'mitra',
        'mitra_onboarding_type' => 'hotel',
    ]);
    $customer = User::factory()->create();

    $filePaths = [
        'mitra/hotel/ktp.jpg',
        'mitra/hotel/selfie.jpg',
        'mitra/hotel/legal.pdf',
        'mitra/hotel/front.jpg',
        'mitra/hotel/lobby.jpg',
        'mitra/hotel/room.jpg',
        'hotel-images/hotel.jpg',
        'room-images/room.jpg',
    ];
    foreach ($filePaths as $path) {
        Storage::disk('public')->put($path, 'file');
    }

    $onboarding = MitraOnboarding::query()->create([
        'user_id' => $mitra->id,
        'hotel_name' => 'Hotel Cascade',
        'city_code' => '3273',
        'ktp_path' => 'mitra/hotel/ktp.jpg',
        'selfie_ktp_path' => 'mitra/hotel/selfie.jpg',
        'legal_doc_path' => 'mitra/hotel/legal.pdf',
        'photo_front_path' => 'mitra/hotel/front.jpg',
        'photo_lobby_path' => 'mitra/hotel/lobby.jpg',
        'photo_room_path' => 'mitra/hotel/room.jpg',
        'verification_status' => 'verified',
        'payout_status' => 'verified',
    ]);
    $hotel = Hotel::query()->create([
        'vendor_id' => $mitra->id,
        'name' => 'Hotel Cascade',
        'city_id' => '3273',
        'address' => 'Jl. Testing',
        'status' => 'published',
    ]);
    $room = RoomType::query()->create([
        'hotel_id' => $hotel->id,
        'name' => 'Deluxe',
        'base_price' => 250000,
        'total_rooms' => 5,
        'status' => 'published',
    ]);
    HotelImage::query()->create([
        'hotel_id' => $hotel->id,
        'image_url' => 'hotel-images/hotel.jpg',
    ]);
    RoomImage::query()->create([
        'room_type_id' => $room->id,
        'image_url' => 'room-images/room.jpg',
    ]);
    $booking = Booking::query()->create([
        'user_id' => $customer->id,
        'hotel_id' => $hotel->id,
        'check_in' => now()->toDateString(),
        'check_out' => now()->addDay()->toDateString(),
        'nights' => 1,
        'rooms_count' => 1,
        'guests_count' => 2,
        'subtotal' => 250000,
        'total' => 250000,
        'status' => 'paid',
    ]);
    Payout::query()->create([
        'hotel_id' => $hotel->id,
        'vendor_id' => $mitra->id,
        'period_start' => now()->startOfMonth()->toDateString(),
        'period_end' => now()->endOfMonth()->toDateString(),
        'total_bookings' => 1,
        'gmv' => 250000,
        'commission_total' => 25000,
        'net_payout' => 225000,
    ]);
    Voucher::query()->create([
        'code' => 'HOTELDELETE',
        'discount_type' => 'fixed',
        'discount_value' => 10000,
        'hotel_id' => $hotel->id,
    ]);

    $this->actingAs($admin)
        ->delete("/admin/mitra/{$mitra->id}")
        ->assertSessionHasNoErrors()
        ->assertSessionHas('status', 'mitra-deleted');

    expect(User::query()->whereKey($mitra->id)->exists())->toBeFalse()
        ->and(MitraOnboarding::query()->whereKey($onboarding->id)->exists())->toBeFalse()
        ->and(Hotel::query()->whereKey($hotel->id)->exists())->toBeFalse()
        ->and(RoomType::query()->whereKey($room->id)->exists())->toBeFalse()
        ->and(Booking::query()->whereKey($booking->id)->exists())->toBeFalse();

    foreach ($filePaths as $path) {
        expect(Storage::disk('public')->exists($path))->toBeFalse();
    }
});

it('deletes wisata mitra with related data and uploaded files', function () {
    Storage::fake('public');

    $admin = adminUserForMitraDeletion();
    $mitra = User::factory()->create([
        'role' => 'mitra',
        'mitra_onboarding_type' => 'wisata',
    ]);
    $customer = User::factory()->create();

    $filePaths = [
        'mitra/wisata/gate.jpg',
        'mitra/wisata/area.jpg',
        'mitra/wisata/ticket.jpg',
        'mitra/wisata/other-a.jpg',
        'mitra/wisata/other-b.jpg',
        'mitra/wisata/ktp.jpg',
        'mitra/wisata/selfie.jpg',
        'mitra/wisata/legal.pdf',
        'wisata-disputes/proof.jpg',
    ];
    foreach ($filePaths as $path) {
        Storage::disk('public')->put($path, 'file');
    }

    $onboarding = MitraWisataOnboarding::query()->create([
        'user_id' => $mitra->id,
        'destination_name' => 'Wisata Cascade',
        'destination_type' => 'alam',
        'photo_gate_path' => 'mitra/wisata/gate.jpg',
        'photo_area_path' => 'mitra/wisata/area.jpg',
        'photo_ticket_path' => 'mitra/wisata/ticket.jpg',
        'photo_other_paths' => ['mitra/wisata/other-a.jpg', 'mitra/wisata/other-b.jpg'],
        'ktp_path' => 'mitra/wisata/ktp.jpg',
        'selfie_ktp_path' => 'mitra/wisata/selfie.jpg',
        'legal_doc_path' => 'mitra/wisata/legal.pdf',
        'verification_status' => 'verified',
        'payout_status' => 'verified',
    ]);
    $ticket = WisataTicket::query()->create([
        'mitra_wisata_onboarding_id' => $onboarding->id,
        'name' => 'Reguler',
        'price' => 50000,
        'quota' => 100,
        'is_active' => true,
    ]);
    $booking = WisataBooking::query()->create([
        'user_id' => $customer->id,
        'mitra_wisata_onboarding_id' => $onboarding->id,
        'wisata_ticket_id' => $ticket->id,
        'booking_code' => 'WISATA-DELETE-1',
        'visit_date' => now()->addDay()->toDateString(),
        'quantity' => 2,
        'unit_price' => 50000,
        'total_price' => 100000,
        'status' => 'paid',
    ]);
    WisataDispute::query()->create([
        'wisata_booking_id' => $booking->id,
        'user_id' => $customer->id,
        'mitra_wisata_onboarding_id' => $onboarding->id,
        'wisata_ticket_id' => $ticket->id,
        'subject' => 'Dokumen',
        'description' => 'Lampiran',
        'attachment_path' => 'wisata-disputes/proof.jpg',
    ]);
    WisataPayout::query()->create([
        'mitra_wisata_onboarding_id' => $onboarding->id,
        'period_start' => now()->startOfMonth()->toDateString(),
        'period_end' => now()->endOfMonth()->toDateString(),
        'total_gmv' => 100000,
        'commission_amount' => 10000,
        'net_payout' => 90000,
    ]);
    WisataCommissionRule::query()->create([
        'mitra_wisata_onboarding_id' => $onboarding->id,
        'type' => 'percentage',
        'value' => 10,
    ]);
    WisataReview::query()->create([
        'mitra_wisata_onboarding_id' => $onboarding->id,
        'user_id' => $customer->id,
        'rating' => 5,
        'comment' => 'Bagus',
    ]);
    WisataAffiliate::query()->create([
        'wisata_id' => $onboarding->id,
        'name' => 'Affiliate Cascade',
        'type' => 'individu',
    ]);
    WisataAffiliateCommission::query()->create([
        'scope_type' => 'wisata',
        'wisata_id' => $onboarding->id,
        'type' => 'percentage',
        'value' => 5,
        'source' => 'platform',
    ]);
    MitraWisataStaff::query()->create([
        'mitra_wisata_onboarding_id' => $onboarding->id,
        'name' => 'Staff Wisata',
        'role' => 'staff_validasi',
    ]);

    $this->actingAs($admin)
        ->delete("/admin/mitra-wisata/{$mitra->id}")
        ->assertSessionHasNoErrors()
        ->assertSessionHas('status', 'mitra-wisata-deleted');

    expect(User::query()->whereKey($mitra->id)->exists())->toBeFalse()
        ->and(MitraWisataOnboarding::query()->whereKey($onboarding->id)->exists())->toBeFalse()
        ->and(WisataTicket::query()->whereKey($ticket->id)->exists())->toBeFalse()
        ->and(WisataBooking::query()->whereKey($booking->id)->exists())->toBeFalse()
        ->and(WisataAffiliateCommission::query()->where('wisata_id', $onboarding->id)->exists())->toBeFalse();

    foreach ($filePaths as $path) {
        expect(Storage::disk('public')->exists($path))->toBeFalse();
    }
});

it('deletes event mitra with related data and uploaded files', function () {
    Storage::fake('public');

    $admin = adminUserForMitraDeletion();
    $mitra = User::factory()->create([
        'role' => 'mitra',
        'mitra_onboarding_type' => 'event',
    ]);
    $customer = User::factory()->create();

    $filePaths = [
        'mitra/event/legal.pdf',
        'mitra/event/ktp.jpg',
        'mitra/event/selfie.jpg',
        'events/event.jpg',
        'event-disputes/proof.jpg',
    ];
    foreach ($filePaths as $path) {
        Storage::disk('public')->put($path, 'file');
    }

    $onboarding = MitraEventOnboarding::query()->create([
        'user_id' => $mitra->id,
        'responsible_name' => 'EO Cascade',
        'eo_name' => 'EO Cascade',
        'legal_doc_path' => 'mitra/event/legal.pdf',
        'ktp_path' => 'mitra/event/ktp.jpg',
        'selfie_ktp_path' => 'mitra/event/selfie.jpg',
        'verification_status' => 'verified',
    ]);
    $organizer = EventOrganizer::query()->create([
        'user_id' => $mitra->id,
        'name' => 'EO Cascade',
        'email' => $mitra->email,
        'status' => 'verified',
    ]);
    $event = Event::query()->create([
        'event_organizer_id' => $organizer->id,
        'event_type' => 'event',
        'title' => 'Event Cascade',
        'description' => 'Test',
        'image_path' => 'events/event.jpg',
        'status' => 'published',
        'capacity_total' => 100,
    ]);
    $ticket = EventTicket::query()->create([
        'event_id' => $event->id,
        'name' => 'Reguler',
        'price' => 150000,
        'quota' => 100,
    ]);
    $booking = EventBooking::query()->create([
        'user_id' => $customer->id,
        'event_id' => $event->id,
        'event_ticket_id' => $ticket->id,
        'booking_code' => 'EVENT-DELETE-1',
        'quantity' => 1,
        'total_price' => 150000,
        'status' => 'paid',
    ]);
    EventDispute::query()->create([
        'event_booking_id' => $booking->id,
        'user_id' => $customer->id,
        'subject' => 'Lampiran',
        'description' => 'Dokumen',
        'attachment_path' => 'event-disputes/proof.jpg',
    ]);
    EventCommission::query()->create([
        'event_id' => $event->id,
        'type' => 'percentage',
        'value' => 10,
    ]);
    EventSettlement::query()->create([
        'event_organizer_id' => $organizer->id,
        'period_start' => now()->startOfMonth()->toDateString(),
        'period_end' => now()->endOfMonth()->toDateString(),
        'total_sales' => 150000,
        'commission_amount' => 15000,
        'net_payout' => 135000,
    ]);
    MitraEventStaff::query()->create([
        'mitra_event_onboarding_id' => $onboarding->id,
        'name' => 'Staff Event',
        'role' => 'staff_checkin',
    ]);

    $this->actingAs($admin)
        ->delete("/admin/events/organizers/{$organizer->id}")
        ->assertSessionHasNoErrors()
        ->assertSessionHas('status', 'mitra-event-deleted');

    expect(User::query()->whereKey($mitra->id)->exists())->toBeFalse()
        ->and(MitraEventOnboarding::query()->whereKey($onboarding->id)->exists())->toBeFalse()
        ->and(EventOrganizer::query()->whereKey($organizer->id)->exists())->toBeFalse()
        ->and(Event::query()->whereKey($event->id)->exists())->toBeFalse()
        ->and(EventBooking::query()->whereKey($booking->id)->exists())->toBeFalse()
        ->and(EventCommission::query()->where('event_id', $event->id)->exists())->toBeFalse();

    foreach ($filePaths as $path) {
        expect(Storage::disk('public')->exists($path))->toBeFalse();
    }
});
