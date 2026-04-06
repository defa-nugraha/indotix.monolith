<?php

namespace App\Services;

use App\Models\RoomInventory;
use App\Models\RoomType;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class BookingService
{
    public function calculatePricing(
        RoomType $roomType,
        string $checkIn,
        string $checkOut,
        int $roomsCount,
        int $guestsCount,
        int $childrenCount = 0,
        array $childrenAges = []
    ): array
    {
        $dates = $this->dateRange($checkIn, $checkOut);
        if (count($dates) === 0) {
            throw new RuntimeException('Tanggal tidak valid.');
        }

        if ($childrenCount < 0 || $guestsCount < 1) {
            throw new RuntimeException('Jumlah tamu tidak valid.');
        }

        if ($childrenCount > $guestsCount) {
            throw new RuntimeException('Jumlah anak melebihi jumlah tamu.');
        }

        $childrenAges = array_values(array_filter($childrenAges, fn ($age) => $age !== null && $age !== ''));
        if (! empty($childrenAges) && count($childrenAges) !== $childrenCount) {
            throw new RuntimeException('Jumlah umur anak tidak sesuai.');
        }

        $maxGuest = (int) ($roomType->max_guest ?? 0);
        if ($maxGuest > 0 && $guestsCount > ($roomsCount * $maxGuest)) {
            throw new RuntimeException('Jumlah tamu melebihi kapasitas kamar.');
        }

        $childAgeMax = (int) ($roomType->child_age_max ?? 12);
        $adultCount = max(0, $guestsCount - $childrenCount);
        foreach ($childrenAges as $age) {
            $ageValue = (int) $age;
            if ($ageValue > $childAgeMax) {
                $adultCount++;
                $childrenCount = max(0, $childrenCount - 1);
            }
        }

        $includedAdults = (int) ($roomType->included_adults ?? 0);
        if ($includedAdults <= 0) {
            $includedAdults = $maxGuest > 0 ? min(2, $maxGuest) : 2;
        }
        if ($maxGuest > 0) {
            $includedAdults = min($includedAdults, $maxGuest);
        }

        $includedCapacity = $includedAdults * $roomsCount;
        $extraAdults = max(0, $adultCount - $includedCapacity);
        $remainingCapacity = max(0, $includedCapacity - $adultCount);
        $extraChildren = max(0, $childrenCount - $remainingCapacity);

        $extraGuests = $extraAdults + $extraChildren;
        $extraBedMax = (int) ($roomType->extra_bed_max ?? 0);
        $extraBedCapacity = $extraBedMax * $roomsCount;
        if ($extraGuests > $extraBedCapacity) {
            throw new RuntimeException('Jumlah tamu melebihi kapasitas ekstra bed.');
        }

        $extraBeds = min($extraGuests, $extraBedCapacity);

        $inventories = RoomInventory::query()
            ->where('room_type_id', $roomType->id)
            ->whereIn('date', $dates)
            ->get()
            ->keyBy(fn ($inventory) => $inventory->date->toDateString());

        $baseSubtotal = 0;
        foreach ($dates as $date) {
            $inventory = $inventories->get($date);
            if (! $inventory) {
                throw new RuntimeException('Inventory tidak tersedia untuk tanggal ini.');
            }

            $price = $inventory->price_override ?? $roomType->base_price;
            $baseSubtotal += (int) round($price) * $roomsCount;
        }

        $nights = count($dates);
        $extraAdultFee = $extraAdults * (int) ($roomType->extra_adult_price ?? 0) * $nights;
        $extraChildFee = $extraChildren * (int) ($roomType->extra_child_price ?? 0) * $nights;
        $extraBedFee = $extraBeds * (int) ($roomType->extra_bed_price ?? 0) * $nights;
        $subtotal = $baseSubtotal + $extraAdultFee + $extraChildFee + $extraBedFee;

        return [
            'nights' => $nights,
            'base_subtotal' => $baseSubtotal,
            'extra_adults' => $extraAdults,
            'extra_children' => $extraChildren,
            'extra_beds' => $extraBeds,
            'extra_adult_fee' => $extraAdultFee,
            'extra_child_fee' => $extraChildFee,
            'extra_bed_fee' => $extraBedFee,
            'included_adults' => $includedAdults,
            'child_age_max' => $childAgeMax,
            'max_guest' => $maxGuest,
            'extra_bed_max' => $extraBedMax,
            'subtotal' => $subtotal,
        ];
    }

    public function reserveInventory(
        RoomType $roomType,
        string $checkIn,
        string $checkOut,
        int $roomsCount,
        bool $useTransaction = true
    ): void
    {
        $dates = $this->dateRange($checkIn, $checkOut);
        if (count($dates) === 0) {
            throw new RuntimeException('Tanggal tidak valid.');
        }

        $handler = function () use ($roomType, $dates, $roomsCount) {
            $inventories = RoomInventory::query()
                ->where('room_type_id', $roomType->id)
                ->whereIn('date', $dates)
                ->lockForUpdate()
                ->get()
                ->keyBy(fn ($inventory) => $inventory->date->toDateString());

            foreach ($dates as $date) {
                $inventory = $inventories->get($date);
                if (! $inventory) {
                    throw new RuntimeException('Inventory tidak tersedia untuk tanggal ini.');
                }

                if ($inventory->is_closed) {
                    throw new RuntimeException('Inventory ditutup untuk tanggal ini.');
                }

                if ($inventory->available_rooms < $roomsCount) {
                    throw new RuntimeException('Kamar tidak mencukupi.');
                }
            }

            foreach ($dates as $date) {
                $inventory = $inventories->get($date);
                $inventory->available_rooms -= $roomsCount;
                $inventory->save();
            }
        };

        if ($useTransaction) {
            DB::transaction($handler);
            return;
        }

        $handler();
    }

    public function releaseInventory(RoomType $roomType, string $checkIn, string $checkOut, int $roomsCount): void
    {
        $dates = $this->dateRange($checkIn, $checkOut);
        if (count($dates) === 0) {
            return;
        }

        DB::transaction(function () use ($roomType, $dates, $roomsCount) {
            $inventories = RoomInventory::query()
                ->where('room_type_id', $roomType->id)
                ->whereIn('date', $dates)
                ->lockForUpdate()
                ->get()
                ->keyBy(fn ($inventory) => $inventory->date->toDateString());

            foreach ($dates as $date) {
                $inventory = $inventories->get($date);
                if (! $inventory) {
                    continue;
                }

                $inventory->available_rooms += $roomsCount;
                $inventory->save();
            }
        });
    }

    private function dateRange(string $checkIn, string $checkOut): array
    {
        $start = Carbon::parse($checkIn);
        $end = Carbon::parse($checkOut);

        if ($end->lessThanOrEqualTo($start)) {
            return [];
        }

        $period = CarbonPeriod::create($start, $end->copy()->subDay());
        return collect($period)->map(fn ($date) => $date->toDateString())->all();
    }
}
