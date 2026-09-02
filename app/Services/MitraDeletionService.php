<?php

namespace App\Services;

use App\Models\CommissionRule;
use App\Models\Event;
use App\Models\EventBooking;
use App\Models\EventCommission;
use App\Models\EventDispute;
use App\Models\EventOrganizer;
use App\Models\EventSettlement;
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
use App\Models\WisataCommissionRule;
use App\Models\WisataDispute;
use App\Models\WisataPayout;
use App\Models\WisataReview;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class MitraDeletionService
{
    public function deleteHotelMitra(User $user): void
    {
        DB::transaction(function () use ($user) {
            $hotelIds = Hotel::query()
                ->where('vendor_id', $user->id)
                ->pluck('id');
            $roomTypeIds = RoomType::query()
                ->whereIn('hotel_id', $hotelIds)
                ->pluck('id');

            $this->deletePublicFiles(HotelImage::query()
                ->whereIn('hotel_id', $hotelIds)
                ->pluck('image_url')
                ->all());
            $this->deletePublicFiles(RoomImage::query()
                ->whereIn('room_type_id', $roomTypeIds)
                ->pluck('image_url')
                ->all());

            $onboarding = MitraOnboarding::query()
                ->where('user_id', $user->id)
                ->first();
            $this->deletePublicFiles($this->hotelOnboardingFiles($onboarding));

            Voucher::query()->whereIn('hotel_id', $hotelIds)->delete();
            CommissionRule::query()->whereIn('hotel_id', $hotelIds)->delete();
            Payout::query()->whereIn('hotel_id', $hotelIds)->delete();
            Hotel::query()->whereIn('id', $hotelIds)->delete();
            MitraOnboarding::query()->where('user_id', $user->id)->delete();
            $user->delete();
        });
    }

    public function deleteWisataMitra(User $user): void
    {
        DB::transaction(function () use ($user) {
            $onboarding = MitraWisataOnboarding::query()
                ->where('user_id', $user->id)
                ->first();

            if (! $onboarding) {
                $user->delete();

                return;
            }

            $this->deletePublicFiles($this->wisataOnboardingFiles($onboarding));
            $this->deletePublicFiles(WisataDispute::query()
                ->where('mitra_wisata_onboarding_id', $onboarding->id)
                ->pluck('attachment_path')
                ->all());

            WisataAffiliateCommission::query()->where('wisata_id', $onboarding->id)->delete();
            WisataAffiliate::query()->where('wisata_id', $onboarding->id)->delete();
            WisataCommissionRule::query()->where('mitra_wisata_onboarding_id', $onboarding->id)->delete();
            WisataReview::query()->where('mitra_wisata_onboarding_id', $onboarding->id)->delete();
            WisataDispute::query()->where('mitra_wisata_onboarding_id', $onboarding->id)->delete();
            WisataPayout::query()->where('mitra_wisata_onboarding_id', $onboarding->id)->delete();
            MitraWisataStaff::query()->where('mitra_wisata_onboarding_id', $onboarding->id)->delete();
            $onboarding->delete();
            $user->delete();
        });
    }

    public function deleteEventOrganizer(EventOrganizer $organizer): void
    {
        DB::transaction(function () use ($organizer) {
            $organizer->loadMissing('user');

            $eventIds = Event::query()
                ->where('event_organizer_id', $organizer->id)
                ->where('event_type', 'event')
                ->pluck('id');
            $bookingIds = EventBooking::query()
                ->whereIn('event_id', $eventIds)
                ->pluck('id');
            $onboarding = MitraEventOnboarding::query()
                ->where('user_id', $organizer->user_id)
                ->first();

            $this->deletePublicFiles(Event::query()
                ->whereIn('id', $eventIds)
                ->pluck('image_path')
                ->all());
            $this->deletePublicFiles(EventDispute::query()
                ->whereIn('event_booking_id', $bookingIds)
                ->pluck('attachment_path')
                ->all());
            $this->deletePublicFiles($this->eventOnboardingFiles($onboarding));

            EventCommission::query()->whereIn('event_id', $eventIds)->delete();
            EventSettlement::query()->where('event_organizer_id', $organizer->id)->delete();

            if ($onboarding) {
                MitraEventStaff::query()
                    ->where('mitra_event_onboarding_id', $onboarding->id)
                    ->delete();
                $onboarding->delete();
            }

            $user = $organizer->user;
            $organizer->delete();
            $user?->delete();
        });
    }

    private function hotelOnboardingFiles(?MitraOnboarding $onboarding): array
    {
        return $this->fileValues($onboarding, [
            'ktp_path',
            'selfie_ktp_path',
            'legal_doc_path',
            'photo_front_path',
            'photo_lobby_path',
            'photo_room_path',
        ]);
    }

    private function wisataOnboardingFiles(?MitraWisataOnboarding $onboarding): array
    {
        return $this->fileValues($onboarding, [
            'photo_gate_path',
            'photo_area_path',
            'photo_ticket_path',
            'photo_product_path',
            'photo_other_paths',
            'ktp_path',
            'selfie_ktp_path',
            'legal_doc_path',
        ]);
    }

    private function eventOnboardingFiles(?MitraEventOnboarding $onboarding): array
    {
        return $this->fileValues($onboarding, [
            'legal_doc_path',
            'ktp_path',
            'selfie_ktp_path',
        ]);
    }

    private function fileValues(?Model $model, array $keys): array
    {
        if (! $model) {
            return [];
        }

        return collect($keys)
            ->flatMap(fn (string $key) => Arr::wrap($model->getAttribute($key)))
            ->all();
    }

    private function deletePublicFiles(array $paths): void
    {
        $paths = collect($paths)
            ->flatten()
            ->filter(fn ($path) => is_string($path) && $path !== '')
            ->unique()
            ->values()
            ->all();

        if ($paths !== []) {
            Storage::disk('public')->delete($paths);
        }
    }
}
