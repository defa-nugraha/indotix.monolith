<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WisataAffiliatePayout extends Model
{
    protected $fillable = [
        'affiliate_id',
        'idempotency_key',
        'period_start',
        'period_end',
        'total_commission',
        'status',
        'bank_name',
        'bank_account_number',
        'bank_account_name',
        'notes',
    ];

    public function affiliate(): BelongsTo
    {
        return $this->belongsTo(WisataAffiliate::class, 'affiliate_id');
    }
}
