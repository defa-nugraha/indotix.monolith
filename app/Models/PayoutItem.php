<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayoutItem extends Model
{
    protected $fillable = [
        'payout_id',
        'booking_id',
        'commission_type',
        'commission_value',
        'commission_amount',
        'booking_total',
    ];

    protected $casts = [
        'commission_value' => 'integer',
        'commission_amount' => 'integer',
        'booking_total' => 'integer',
    ];

    public function payout(): BelongsTo
    {
        return $this->belongsTo(Payout::class);
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }
}
