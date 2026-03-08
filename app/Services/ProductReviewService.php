<?php

namespace App\Services;

use App\Models\AcademyBooking;
use App\Models\AcademyClass;
use App\Models\Booking;
use App\Models\Event;
use App\Models\EventBooking;
use App\Models\EventOrganizer;
use App\Models\Hotel;
use App\Models\MitraWisataOnboarding;
use App\Models\ProductReview;
use App\Models\SouvenirOrder;
use App\Models\SouvenirProduct;
use App\Models\SpecialProgram;
use App\Models\SpecialProgramBooking;
use App\Models\User;
use App\Models\WisataBooking;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

class ProductReviewService
{
    public const TYPES = [
        'hotel',
        'wisata',
        'event',
        'academy',
        'souvenir',
        'special_program',
    ];

    public static function isValidType(string $type): bool
    {
        return in_array($type, self::TYPES, true);
    }

    public static function findProduct(string $type, int $id): ?Model
    {
        return match ($type) {
            'hotel' => Hotel::query()->find($id),
            'wisata' => MitraWisataOnboarding::query()->find($id),
            'event' => Event::query()->find($id),
            'academy' => AcademyClass::query()->find($id),
            'souvenir' => SouvenirProduct::query()->find($id),
            'special_program' => SpecialProgram::query()->find($id),
            default => null,
        };
    }

    public static function resolveTitle(string $type, int $id): ?string
    {
        return match ($type) {
            'hotel' => Hotel::query()->whereKey($id)->value('name'),
            'wisata' => MitraWisataOnboarding::query()->whereKey($id)->value('destination_name'),
            'event' => Event::query()->whereKey($id)->value('title'),
            'academy' => AcademyClass::query()->whereKey($id)->value('title'),
            'souvenir' => SouvenirProduct::query()->whereKey($id)->value('name'),
            'special_program' => SpecialProgram::query()->whereKey($id)->value('name'),
            default => null,
        };
    }

    public static function resolveTitles(string $type, Collection $ids): array
    {
        $ids = $ids->filter()->unique()->values();
        if ($ids->isEmpty()) {
            return [];
        }

        return match ($type) {
            'hotel' => Hotel::query()->whereIn('id', $ids)->pluck('name', 'id')->all(),
            'wisata' => MitraWisataOnboarding::query()->whereIn('id', $ids)->pluck('destination_name', 'id')->all(),
            'event' => Event::query()->whereIn('id', $ids)->pluck('title', 'id')->all(),
            'academy' => AcademyClass::query()->whereIn('id', $ids)->pluck('title', 'id')->all(),
            'souvenir' => SouvenirProduct::query()->whereIn('id', $ids)->pluck('name', 'id')->all(),
            'special_program' => SpecialProgram::query()->whereIn('id', $ids)->pluck('name', 'id')->all(),
            default => [],
        };
    }

    public static function resolveOwnerId(string $type, int $id): ?int
    {
        return match ($type) {
            'hotel' => Hotel::query()->whereKey($id)->value('vendor_id'),
            'wisata' => MitraWisataOnboarding::query()->whereKey($id)->value('user_id'),
            'event' => Event::query()
                ->with('organizer')
                ->whereKey($id)
                ->first()
                ?->organizer
                ?->user_id,
            'academy' => null,
            'souvenir' => SouvenirProduct::query()->whereKey($id)->value('created_by'),
            'special_program' => SpecialProgram::query()->whereKey($id)->value('created_by'),
            default => null,
        };
    }

    public static function ownerProductIds(User $user, string $type): Collection
    {
        return match ($type) {
            'hotel' => Hotel::query()->where('vendor_id', $user->id)->pluck('id'),
            'wisata' => MitraWisataOnboarding::query()->where('user_id', $user->id)->pluck('id'),
            'event' => self::eventIdsFor($user),
            'souvenir' => SouvenirProduct::query()->where('created_by', $user->id)->pluck('id'),
            'special_program' => SpecialProgram::query()->where('created_by', $user->id)->pluck('id'),
            'academy' => collect(),
            default => collect(),
        };
    }

    public static function canManage(User $user, ProductReview $review): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        $ownerId = self::resolveOwnerId($review->product_type, $review->product_id);
        return $ownerId !== null && (int) $ownerId === (int) $user->id;
    }

    public static function publicReviews(string $type, int $productId): array
    {
        return ProductReview::query()
            ->where('product_type', $type)
            ->where('product_id', $productId)
            ->where('status', 'active')
            ->with(['user:id,name', 'replier:id,name'])
            ->latest('id')
            ->get()
            ->map(fn (ProductReview $review) => [
                'id' => $review->id,
                'rating' => $review->rating,
                'comment' => $review->comment,
                'user_name' => $review->user?->name ?? 'User',
                'created_at' => $review->created_at?->toDateTimeString(),
                'reply' => $review->reply,
                'reply_by' => $review->replier?->name,
                'reply_at' => $review->replied_at?->toDateTimeString(),
                'user_id' => $review->user_id,
            ])
            ->values()
            ->all();
    }

    public static function userReview(?int $userId, string $type, int $productId): ?array
    {
        if (! $userId) {
            return null;
        }

        $review = ProductReview::query()
            ->where('user_id', $userId)
            ->where('product_type', $type)
            ->where('product_id', $productId)
            ->first();

        if (! $review) {
            return null;
        }

        return [
            'id' => $review->id,
            'rating' => $review->rating,
            'comment' => $review->comment,
            'created_at' => $review->created_at?->toDateTimeString(),
        ];
    }

    public static function hasUsedBooking(int $userId, string $type, int $productId): bool
    {
        return match ($type) {
            'hotel' => Booking::query()
                ->where('user_id', $userId)
                ->where('hotel_id', $productId)
                ->where(function ($query) {
                    $query
                        ->where('status', 'completed')
                        ->orWhere('stay_status', 'checked_out');
                })
                ->exists(),
            'wisata' => WisataBooking::query()
                ->where('user_id', $userId)
                ->where('mitra_wisata_onboarding_id', $productId)
                ->where(function ($query) {
                    $query
                        ->where('status', 'completed')
                        ->orWhereHas('scans');
                })
                ->exists(),
            'event' => EventBooking::query()
                ->where('user_id', $userId)
                ->where('event_id', $productId)
                ->where(function ($query) {
                    $query
                        ->where('status', 'completed')
                        ->orWhereHas('scans');
                })
                ->exists(),
            'academy' => AcademyBooking::query()
                ->where('user_id', $userId)
                ->where('academy_class_id', $productId)
                ->where(function ($query) {
                    $query
                        ->where('status', 'completed')
                        ->orWhereHas('scans');
                })
                ->exists(),
            'special_program' => SpecialProgramBooking::query()
                ->where('user_id', $userId)
                ->where('special_program_id', $productId)
                ->where('status', 'completed')
                ->exists(),
            'souvenir' => SouvenirOrder::query()
                ->where('user_id', $userId)
                ->whereHas('items', fn ($query) => $query->where('product_id', $productId))
                ->where(function ($query) {
                    $query
                        ->where('status', 'completed')
                        ->orWhereRaw('LOWER(COALESCE(shipping_status, \'\')) in (?, ?, ?, ?, ?)', [
                            'delivered',
                            'arrived',
                            'sampai',
                            'received',
                            'done',
                        ]);
                })
                ->exists(),
            default => false,
        };
    }

    private static function eventIdsFor(User $user): Collection
    {
        $organizerId = EventOrganizer::query()->where('user_id', $user->id)->value('id');
        if (! $organizerId) {
            return collect();
        }

        return Event::query()->where('event_organizer_id', $organizerId)->pluck('id');
    }
}
