<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RoomType extends Model
{
    protected $fillable = [
        'hotel_id',
        'name',
        'description',
        'max_guest',
        'bed_type',
        'base_price',
        'strike_price',
        'total_rooms',
        'status',
    ];

    protected $casts = [
        'max_guest' => 'integer',
        'base_price' => 'decimal:2',
        'strike_price' => 'decimal:2',
        'total_rooms' => 'integer',
    ];

    public function hotel(): BelongsTo
    {
        return $this->belongsTo(Hotel::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(RoomImage::class);
    }

    public function inventories(): HasMany
    {
        return $this->hasMany(RoomInventory::class);
    }
}
