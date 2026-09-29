<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentWebhookEvent extends Model
{
    protected $fillable = [
        'provider',
        'event_key',
        'external_id',
        'payload_hash',
        'wisata_payment_id',
        'reference_id',
        'provider_transaction_id',
        'status',
        'rejection_reason',
        'metadata',
        'processed_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'processed_at' => 'datetime',
    ];

    public function payment(): BelongsTo
    {
        return $this->belongsTo(WisataPayment::class, 'wisata_payment_id');
    }
}
