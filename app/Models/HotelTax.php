<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HotelTax extends Model
{
    protected $fillable = [
        'hotel_id',
        'name',
        'rate',
    ];

    protected $casts = [
        'rate' => 'float',
    ];

    public function hotel(): BelongsTo
    {
        return $this->belongsTo(Hotel::class);
    }
}
