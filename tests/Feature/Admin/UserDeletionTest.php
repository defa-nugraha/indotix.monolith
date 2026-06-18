<?php

use App\Models\AcademyBooking;
use App\Models\AcademyClass;
use App\Models\AcademyTicket;
use App\Models\Booking;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\Event;
use App\Models\EventBooking;
use App\Models\EventOrganizer;
use App\Models\EventTicket;
use App\Models\Hotel;
use App\Models\MitraWisataOnboarding;
use App\Models\ProductReview;
use App\Models\ProductReviewMedia;
use App\Models\RoomType;
use App\Models\SouvenirOrder;
use App\Models\SouvenirProduct;
use App\Models\SpecialProgram;
use App\Models\SpecialProgramBooking;
use App\Models\User;
use App\Models\UserAddress;
use App\Models\UserDeviceToken;
use App\Models\UserNotification;
use App\Models\WisataBooking;
use App\Models\WisataReview;
use App\Models\WisataTicket;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

function adminUserForUserDeletion(): User
{
    return User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);
}

function seedRegionForUserDeletion(): void
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

it('deletes user with related transactions account data chats and uploaded review media', function () {
    Storage::fake('public');
    seedRegionForUserDeletion();

    $admin = adminUserForUserDeletion();
    $user = User::factory()->create([
        'role' => 'user',
        'email' => 'delete-user@indotix.test',
    ]);
    $partner = User::factory()->create([
        'role' => 'mitra',
        'mitra_onboarding_type' => 'hotel',
    ]);

    Storage::disk('public')->put('reviews/user-review.jpg', 'image');
    Storage::disk('public')->put('reviews/user-review-thumb.jpg', 'thumb');

    $hotel = Hotel::query()->create([
        'vendor_id' => $partner->id,
        'name' => 'Hotel User Delete',
        'city_id' => '3273',
        'address' => 'Jl. Testing',
        'status' => 'published',
    ]);
    $hotelBooking = Booking::query()->create([
        'user_id' => $user->id,
        'hotel_id' => $hotel->id,
        'check_in' => now()->toDateString(),
        'check_out' => now()->addDay()->toDateString(),
        'nights' => 1,
        'rooms_count' => 1,
        'guests_count' => 2,
        'subtotal' => 200000,
        'total' => 200000,
        'status' => 'paid',
    ]);

    $wisata = MitraWisataOnboarding::query()->create([
        'user_id' => $partner->id,
        'destination_name' => 'Wisata User Delete',
        'destination_type' => 'alam',
        'verification_status' => 'verified',
    ]);
    $wisataTicket = WisataTicket::query()->create([
        'mitra_wisata_onboarding_id' => $wisata->id,
        'name' => 'Reguler',
        'price' => 50000,
        'quota' => 100,
        'is_active' => true,
    ]);
    $wisataBooking = WisataBooking::query()->create([
        'user_id' => $user->id,
        'mitra_wisata_onboarding_id' => $wisata->id,
        'wisata_ticket_id' => $wisataTicket->id,
        'booking_code' => 'WISATA-USER-DELETE',
        'visit_date' => now()->addDay()->toDateString(),
        'quantity' => 2,
        'unit_price' => 50000,
        'total_price' => 100000,
        'status' => 'paid',
    ]);
    $wisataReview = WisataReview::query()->create([
        'mitra_wisata_onboarding_id' => $wisata->id,
        'user_id' => $user->id,
        'rating' => 5,
        'comment' => 'Bagus',
    ]);

    $organizer = EventOrganizer::query()->create([
        'user_id' => $partner->id,
        'name' => 'EO User Delete',
        'email' => $partner->email,
        'status' => 'verified',
    ]);
    $event = Event::query()->create([
        'event_organizer_id' => $organizer->id,
        'event_type' => 'event',
        'title' => 'Event User Delete',
        'status' => 'published',
        'capacity_total' => 100,
    ]);
    $eventTicket = EventTicket::query()->create([
        'event_id' => $event->id,
        'name' => 'Reguler',
        'price' => 75000,
        'quota' => 100,
    ]);
    $eventBooking = EventBooking::query()->create([
        'user_id' => $user->id,
        'event_id' => $event->id,
        'event_ticket_id' => $eventTicket->id,
        'booking_code' => 'EVENT-USER-DELETE',
        'quantity' => 1,
        'total_price' => 75000,
        'status' => 'paid',
    ]);

    $academyClass = AcademyClass::query()->create([
        'title' => 'Academy User Delete',
        'start_at' => now()->addWeek(),
        'end_at' => now()->addWeek()->addHours(2),
        'capacity_total' => 20,
        'status' => 'open_for_sale',
    ]);
    $academyTicket = AcademyTicket::query()->create([
        'academy_class_id' => $academyClass->id,
        'name' => 'Reguler',
        'price' => 125000,
        'quota' => 20,
    ]);
    $academyBooking = AcademyBooking::query()->create([
        'user_id' => $user->id,
        'academy_class_id' => $academyClass->id,
        'academy_ticket_id' => $academyTicket->id,
        'booking_code' => 'ACADEMY-USER-DELETE',
        'quantity' => 1,
        'total_price' => 125000,
        'status' => 'paid',
        'payment_status' => 'paid',
    ]);

    $specialProgram = SpecialProgram::query()->create([
        'name' => 'Program User Delete',
        'program_type' => 'event',
        'status' => 'published',
        'is_active' => true,
    ]);
    $specialProgramBooking = SpecialProgramBooking::query()->create([
        'user_id' => $user->id,
        'special_program_id' => $specialProgram->id,
        'item_type' => 'event',
        'item_id' => $event->id,
        'item_name' => $event->title,
        'quantity' => 1,
        'unit_price' => 50000,
        'total_price' => 50000,
        'status' => 'paid',
        'payment_status' => 'paid',
    ]);

    $souvenirProduct = SouvenirProduct::query()->create([
        'name' => 'Souvenir User Delete',
        'price' => 25000,
        'sku' => 'SOUV-USER-DELETE',
        'stock' => 10,
        'is_active' => true,
    ]);
    $souvenirOrder = SouvenirOrder::query()->create([
        'user_id' => $user->id,
        'status' => 'paid',
        'payment_status' => 'paid',
        'total_price' => 25000,
        'shipping_method' => 'delivery',
    ]);
    DB::table('souvenir_order_items')->insert([
        'souvenir_order_id' => $souvenirOrder->id,
        'product_id' => $souvenirProduct->id,
        'product_name' => $souvenirProduct->name,
        'unit_price' => 25000,
        'quantity' => 1,
        'subtotal' => 25000,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $review = ProductReview::query()->create([
        'product_type' => 'hotel',
        'product_id' => $hotel->id,
        'user_id' => $user->id,
        'rating' => 5,
        'comment' => 'Review dengan media',
    ]);
    ProductReviewMedia::query()->create([
        'product_review_id' => $review->id,
        'type' => 'image',
        'path' => 'reviews/user-review.jpg',
        'thumbnail_path' => 'reviews/user-review-thumb.jpg',
    ]);
    UserAddress::query()->create([
        'user_id' => $user->id,
        'label' => 'Rumah',
        'recipient_name' => $user->name,
        'phone' => '08123456789',
        'address_line' => 'Jl. User Delete',
    ]);
    UserNotification::query()->create([
        'user_id' => $user->id,
        'title' => 'Notifikasi',
        'message' => 'Pesan',
        'type' => 'info',
    ]);
    UserDeviceToken::query()->create([
        'user_id' => $user->id,
        'token' => 'device-token-user-delete',
        'platform' => 'android',
    ]);
    DB::table('email_otps')->insert([
        'user_id' => $user->id,
        'email' => $user->email,
        'purpose' => 'verification',
        'code_hash' => 'hash',
        'expires_at' => now()->addMinutes(10),
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    DB::table('search_logs')->insert([
        'user_id' => $user->id,
        'product_type' => 'hotel',
        'keyword' => 'Bandung',
        'result_count' => 1,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    $conversation = ChatConversation::query()->create([
        'user_id' => $user->id,
        'partner_id' => $partner->id,
        'status' => 'open',
    ]);
    $message = ChatMessage::query()->create([
        'conversation_id' => $conversation->id,
        'sender_id' => $user->id,
        'body' => 'Halo',
    ]);

    $this->actingAs($admin)
        ->delete("/admin/users/{$user->id}")
        ->assertSessionHasNoErrors()
        ->assertSessionHas('status', 'user-deleted');

    expect(User::query()->whereKey($user->id)->exists())->toBeFalse()
        ->and(Booking::query()->whereKey($hotelBooking->id)->exists())->toBeFalse()
        ->and(WisataBooking::query()->whereKey($wisataBooking->id)->exists())->toBeFalse()
        ->and(EventBooking::query()->whereKey($eventBooking->id)->exists())->toBeFalse()
        ->and(AcademyBooking::query()->whereKey($academyBooking->id)->exists())->toBeFalse()
        ->and(SpecialProgramBooking::query()->whereKey($specialProgramBooking->id)->exists())->toBeFalse()
        ->and(SouvenirOrder::query()->whereKey($souvenirOrder->id)->exists())->toBeFalse()
        ->and(ProductReview::query()->whereKey($review->id)->exists())->toBeFalse()
        ->and(WisataReview::query()->whereKey($wisataReview->id)->exists())->toBeFalse()
        ->and(UserAddress::query()->where('user_id', $user->id)->exists())->toBeFalse()
        ->and(UserNotification::query()->where('user_id', $user->id)->exists())->toBeFalse()
        ->and(UserDeviceToken::query()->where('user_id', $user->id)->exists())->toBeFalse()
        ->and(DB::table('email_otps')->where('user_id', $user->id)->exists())->toBeFalse()
        ->and(DB::table('search_logs')->where('user_id', $user->id)->exists())->toBeFalse()
        ->and(ChatConversation::query()->whereKey($conversation->id)->exists())->toBeFalse()
        ->and(ChatMessage::query()->whereKey($message->id)->exists())->toBeFalse()
        ->and(Storage::disk('public')->exists('reviews/user-review.jpg'))->toBeFalse()
        ->and(Storage::disk('public')->exists('reviews/user-review-thumb.jpg'))->toBeFalse();
});

it('does not delete admin accounts through the user management delete route', function () {
    $admin = adminUserForUserDeletion();
    $otherAdmin = adminUserForUserDeletion();

    $this->actingAs($admin)
        ->delete("/admin/users/{$otherAdmin->id}")
        ->assertNotFound();

    expect(User::query()->whereKey($otherAdmin->id)->exists())->toBeTrue();
});
