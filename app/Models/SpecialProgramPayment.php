<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SpecialProgramPayment extends Model
{
    protected $fillable = [
        'special_program_booking_id',
        'provider',
        'status',
        'gross_amount',
        'payment_type',
        'transaction_id',
        'order_id',
        'payload',
    ];

    protected $casts = [
        'payload' => 'array',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(SpecialProgramBooking::class, 'special_program_booking_id');
    }
}
