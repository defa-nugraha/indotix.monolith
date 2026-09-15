<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WisataRefund extends Model
{
    protected $fillable = [
        'wisata_booking_id',
        'wisata_payment_id',
        'refund_key',
        'amount',
        'status',
        'provider_action',
        'provider_refund_id',
        'provider_payload',
        'last_error',
        'processed_at',
        'created_by_admin_id',
    ];

    protected $casts = [
        'amount' => 'integer',
        'provider_payload' => 'array',
        'processed_at' => 'datetime',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(WisataBooking::class, 'wisata_booking_id');
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(WisataPayment::class, 'wisata_payment_id');
    }

    public function createdByAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_admin_id');
    }
}
