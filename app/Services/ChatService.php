<?php

namespace App\Services;

use App\Models\AcademyClass;
use App\Models\Event;
use App\Models\Hotel;
use App\Models\MitraWisataOnboarding;
use App\Models\SouvenirProduct;
use App\Models\SpecialProgram;
use App\Models\User;

class ChatService
{
    public static function resolvePartnerId(string $type, ?int $id): ?int
    {
        $adminId = self::adminId();

        return match ($type) {
            'wisata' => optional(MitraWisataOnboarding::query()->find($id))->user_id ?? $adminId,
            'hotel' => optional(Hotel::query()->find($id))->vendor_id ?? $adminId,
            'souvenir' => optional(SouvenirProduct::query()->find($id))->created_by ?? $adminId,
            'event' => optional(optional(Event::query()->with('organizer')->find($id))->organizer)->user_id ?? $adminId,
            'academy' => $adminId,
            'special_program' => $adminId,
            'admin' => $adminId,
            default => $adminId,
        };
    }

    public static function resolveSubjectTitle(string $type, ?int $id): ?string
    {
        return match ($type) {
            'wisata' => optional(MitraWisataOnboarding::query()->find($id))->destination_name,
            'hotel' => optional(Hotel::query()->find($id))->name,
            'souvenir' => optional(SouvenirProduct::query()->find($id))->name,
            'event' => optional(Event::query()->find($id))->title,
            'academy' => optional(AcademyClass::query()->find($id))->title,
            'special_program' => optional(SpecialProgram::query()->find($id))->name,
            default => null,
        };
    }

    public static function subjectLabel(?string $type): string
    {
        return match ($type) {
            'wisata' => 'Wisata',
            'hotel' => 'Hotel',
            'souvenir' => 'Souvenir',
            'event' => 'Event',
            'academy' => 'Academy',
            'special_program' => 'Special Program',
            'admin' => 'Customer Service',
            default => 'Chat',
        };
    }

    public static function adminId(): ?int
    {
        return User::query()->where('role', 'admin')->orderBy('id')->value('id');
    }
}
