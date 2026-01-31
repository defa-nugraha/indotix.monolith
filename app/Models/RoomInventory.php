<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class RoomInventory extends Model
{
    protected $fillable = [
        'room_type_id',
        'date',
        'available_rooms',
        'price_override',
        'is_closed',
        'breakfast_included',
        'smoking_allowed',
    ];

    protected $casts = [
        'date' => 'date',
        'available_rooms' => 'integer',
        'price_override' => 'decimal:2',
        'is_closed' => 'boolean',
        'breakfast_included' => 'boolean',
        'smoking_allowed' => 'boolean',
    ];

    public function roomType(): BelongsTo
    {
        return $this->belongsTo(RoomType::class);
    }

    /**
     * Atomic room reservation (transaction lock) to prevent double booking.
     */
    public static function reserveRooms(int $roomTypeId, string $date, int $quantity): void
    {
        DB::transaction(function () use ($roomTypeId, $date, $quantity) {
            $inventory = RoomInventory::query()
                ->where('room_type_id', $roomTypeId)
                ->whereDate('date', $date)
                ->lockForUpdate()
                ->first();

            if (! $inventory) {
                throw new RuntimeException('Inventory tidak tersedia untuk tanggal ini.');
            }

            if ($inventory->is_closed) {
                throw new RuntimeException('Inventory ditutup untuk tanggal ini.');
            }

            if ($inventory->available_rooms < $quantity) {
                throw new RuntimeException('Kamar tidak mencukupi.');
            }

            $inventory->available_rooms -= $quantity;
            $inventory->save();
        });
    }
}
