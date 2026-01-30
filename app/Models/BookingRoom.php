<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingRoom extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'room_type_id',
        'rooms_count',
        'price_per_night',
        'subtotal',
    ];

    protected $casts = [
        'rooms_count' => 'integer',
        'price_per_night' => 'integer',
        'subtotal' => 'integer',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function roomType(): BelongsTo
    {
        return $this->belongsTo(RoomType::class);
    }
}
