<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'provider',
        'status',
        'gross_amount',
        'payment_type',
        'transaction_id',
        'order_id',
        'payload',
    ];

    protected $casts = [
        'gross_amount' => 'integer',
        'payload' => 'array',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }
}
