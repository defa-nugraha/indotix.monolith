<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WisataAffiliateCommissionItem extends Model
{
    protected $fillable = [
        'affiliate_id',
        'wisata_booking_id',
        'commission_amount',
        'status',
        'reason',
    ];

    public function affiliate(): BelongsTo
    {
        return $this->belongsTo(WisataAffiliate::class, 'affiliate_id');
    }
}
