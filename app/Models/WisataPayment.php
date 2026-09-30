<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WisataPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'wisata_booking_id',
        'provider',
        'status',
        'internal_status',
        'gross_amount',
        'provider_amount',
        'fee',
        'payment_type',
        'payment_channel',
        'transaction_id',
        'provider_reference_id',
        'order_id',
        'payment_url',
        'expires_at',
        'paid_at',
        'failed_at',
        'active_key',
        'reconciliation_attempts',
        'last_reconciled_at',
        'last_gateway_error',
        'notification_dispatched_at',
        'payload',
    ];

    protected $casts = [
        'gross_amount' => 'integer',
        'provider_amount' => 'integer',
        'fee' => 'integer',
        'expires_at' => 'datetime',
        'paid_at' => 'datetime',
        'failed_at' => 'datetime',
        'reconciliation_attempts' => 'integer',
        'last_reconciled_at' => 'datetime',
        'notification_dispatched_at' => 'datetime',
        'payload' => 'array',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(WisataBooking::class, 'wisata_booking_id');
    }

    public function refunds()
    {
        return $this->hasMany(WisataRefund::class, 'wisata_payment_id');
    }
}
