<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WisataAffiliateLink extends Model
{
    protected $fillable = [
        'affiliate_id',
        'code',
        'token',
        'landing_url',
        'status',
        'attribution_model',
        'cookie_days',
    ];

    public function affiliate(): BelongsTo
    {
        return $this->belongsTo(WisataAffiliate::class, 'affiliate_id');
    }

    public function clicks(): HasMany
    {
        return $this->hasMany(WisataAffiliateClick::class, 'affiliate_link_id');
    }
}
