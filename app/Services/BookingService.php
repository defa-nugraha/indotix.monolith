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
    public function calculatePricing(RoomType $roomType, string $checkIn, string $checkOut, int $roomsCount): array
    {
        $dates = $this->dateRange($checkIn, $checkOut);
        if (count($dates) === 0) {
            throw new RuntimeException('Tanggal tidak valid.');
        }

        $inventories = RoomInventory::query()
            ->where('room_type_id', $roomType->id)
            ->whereIn('date', $dates)
            ->get()
            ->keyBy(fn ($inventory) => $inventory->date->toDateString());

        $subtotal = 0;
        foreach ($dates as $date) {
            $inventory = $inventories->get($date);
            if (! $inventory) {
                throw new RuntimeException('Inventory tidak tersedia untuk tanggal ini.');
            }

            $price = $inventory->price_override ?? $roomType->base_price;
            $subtotal += (int) round($price) * $roomsCount;
        }

        return [
            'nights' => count($dates),
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
