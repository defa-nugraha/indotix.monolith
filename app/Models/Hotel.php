<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Hotel extends Model
{
    protected $fillable = [
        'vendor_id',
        'name',
        'description',
        'city_id',
        'address',
        'latitude',
        'longitude',
        'star_rating',
        'check_in_time',
        'check_out_time',
        'status',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'star_rating' => 'integer',
    ];

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'vendor_id');
    }

    public function city(): BelongsTo
    {
        return $this->belongsTo(Regency::class, 'city_id', 'code');
    }

    public function roomTypes(): HasMany
    {
        return $this->hasMany(RoomType::class);
    }

    public function facilities(): HasMany
    {
        return $this->hasMany(HotelFacility::class);
    }
}
