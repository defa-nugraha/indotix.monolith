<?php

use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\MitraWisataOnboarding;
use App\Models\ProductReview;
use App\Models\ProductReviewMedia;
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
    return User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);
}

it('deletes user with wisata account data chats and uploaded review media', function () {
    Storage::fake('public');
    $admin = adminUserForUserDeletion();
    $user = User::factory()->create(['role' => 'user', 'email' => 'delete-user@indotix.test']);
    $partner = User::factory()->create(['role' => 'mitra', 'mitra_onboarding_type' => 'wisata']);
    Storage::disk('public')->put('reviews/user-review.jpg', 'image');
    Storage::disk('public')->put('reviews/user-review-thumb.jpg', 'thumb');

    $destination = MitraWisataOnboarding::query()->create([
        'user_id' => $partner->id,
        'destination_name' => 'Wisata User Delete',
        'destination_type' => 'alam',
        'verification_status' => 'verified',
    ]);
    $ticket = WisataTicket::query()->create([
        'mitra_wisata_onboarding_id' => $destination->id,
        'name' => 'Reguler', 'price' => 50000, 'quota' => 100, 'is_active' => true,
    ]);
    $booking = WisataBooking::query()->create([
        'user_id' => $user->id,
        'mitra_wisata_onboarding_id' => $destination->id,
        'wisata_ticket_id' => $ticket->id,
        'booking_code' => 'WISATA-USER-DELETE',
        'visit_date' => now()->addDay()->toDateString(),
        'quantity' => 2, 'unit_price' => 50000, 'total_price' => 100000, 'status' => 'paid',
    ]);
    $wisataReview = WisataReview::query()->create([
        'mitra_wisata_onboarding_id' => $destination->id, 'user_id' => $user->id,
        'rating' => 5, 'comment' => 'Bagus',
    ]);
    $review = ProductReview::query()->create([
        'product_type' => 'wisata', 'product_id' => $destination->id, 'user_id' => $user->id,
        'rating' => 5, 'comment' => 'Review dengan media',
    ]);
    ProductReviewMedia::query()->create([
        'product_review_id' => $review->id, 'type' => 'image',
        'path' => 'reviews/user-review.jpg', 'thumbnail_path' => 'reviews/user-review-thumb.jpg',
    ]);
    UserAddress::query()->create([
        'user_id' => $user->id, 'label' => 'Rumah', 'recipient_name' => $user->name,
        'phone' => '08123456789', 'address_line' => 'Jl. User Delete',
    ]);
    UserNotification::query()->create([
        'user_id' => $user->id, 'title' => 'Notifikasi', 'message' => 'Pesan', 'type' => 'info',
    ]);
    UserDeviceToken::query()->create([
        'user_id' => $user->id, 'token' => 'device-token-user-delete', 'platform' => 'android',
    ]);
    DB::table('email_otps')->insert([
        'user_id' => $user->id, 'email' => $user->email, 'purpose' => 'verification',
        'code_hash' => 'hash', 'expires_at' => now()->addMinutes(10),
        'created_at' => now(), 'updated_at' => now(),
    ]);
    $conversation = ChatConversation::query()->create([
        'user_id' => $user->id, 'partner_id' => $partner->id, 'status' => 'open',
    ]);
    $message = ChatMessage::query()->create([
        'conversation_id' => $conversation->id, 'sender_id' => $user->id, 'body' => 'Halo',
    ]);

    $this->actingAs($admin)
        ->delete("/admin/users/{$user->id}")
        ->assertSessionHasNoErrors()
        ->assertSessionHas('status', 'user-deleted');

    expect(User::query()->whereKey($user->id)->exists())->toBeFalse()
        ->and(WisataBooking::query()->whereKey($booking->id)->exists())->toBeFalse()
        ->and(ProductReview::query()->whereKey($review->id)->exists())->toBeFalse()
        ->and(WisataReview::query()->whereKey($wisataReview->id)->exists())->toBeFalse()
        ->and(UserAddress::query()->where('user_id', $user->id)->exists())->toBeFalse()
        ->and(UserNotification::query()->where('user_id', $user->id)->exists())->toBeFalse()
        ->and(UserDeviceToken::query()->where('user_id', $user->id)->exists())->toBeFalse()
        ->and(DB::table('email_otps')->where('user_id', $user->id)->exists())->toBeFalse()
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
