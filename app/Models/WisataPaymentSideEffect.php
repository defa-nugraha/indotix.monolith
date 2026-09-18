<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WisataPaymentSideEffect extends Model
{
    protected $fillable = [
        'wisata_payment_id',
        'effect_type',
        'status',
        'attempts',
        'claimed_at',
        'completed_at',
        'last_error',
    ];

    protected $casts = [
        'attempts' => 'integer',
        'claimed_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function payment(): BelongsTo
    {
        return $this->belongsTo(WisataPayment::class, 'wisata_payment_id');
    }
}
