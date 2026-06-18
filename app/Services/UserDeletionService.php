<?php

namespace App\Services;

use App\Models\AcademyBooking;
use App\Models\Booking;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\EmailOtp;
use App\Models\EventBooking;
use App\Models\EventDispute;
use App\Models\ProductReview;
use App\Models\SearchLog;
use App\Models\SouvenirOrder;
use App\Models\SpecialProgramBooking;
use App\Models\User;
use App\Models\UserAddress;
use App\Models\UserDeviceToken;
use App\Models\UserNotification;
use App\Models\WisataBooking;
use App\Models\WisataDispute;
use App\Models\WisataReview;
use Illuminate\Support\Facades\DB;

class UserDeletionService
{
    public function deleteUser(User $user): void
    {
        DB::transaction(function () use ($user) {
            $conversationIds = ChatConversation::query()
                ->where('user_id', $user->id)
                ->orWhere('partner_id', $user->id)
                ->pluck('id');

            ChatMessage::query()
                ->whereIn('conversation_id', $conversationIds)
                ->orWhere('sender_id', $user->id)
                ->delete();
            ChatConversation::query()
                ->whereIn('id', $conversationIds)
                ->delete();

            ProductReview::query()
                ->where('user_id', $user->id)
                ->get()
                ->each
                ->delete();
            WisataReview::query()->where('user_id', $user->id)->delete();
            EventDispute::query()->where('user_id', $user->id)->delete();
            WisataDispute::query()->where('user_id', $user->id)->delete();

            SouvenirOrder::query()->where('user_id', $user->id)->delete();
            Booking::query()->where('user_id', $user->id)->delete();
            WisataBooking::query()->where('user_id', $user->id)->delete();
            EventBooking::query()->where('user_id', $user->id)->delete();
            AcademyBooking::query()->where('user_id', $user->id)->delete();
            SpecialProgramBooking::query()->where('user_id', $user->id)->delete();

            UserAddress::query()->where('user_id', $user->id)->delete();
            UserNotification::query()->where('user_id', $user->id)->delete();
            UserDeviceToken::query()->where('user_id', $user->id)->delete();
            EmailOtp::query()->where('user_id', $user->id)->delete();
            SearchLog::query()->where('user_id', $user->id)->delete();

            $user->delete();
        });
    }
}
