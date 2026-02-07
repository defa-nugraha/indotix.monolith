<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WisataAffiliate extends Model
{
    protected $fillable = [
        'name',
        'email',
        'phone',
        'type',
        'platform',
        'status',
        'notes',
        'bank_name',
        'bank_account_number',
        'bank_account_name',
    ];

    public function links(): HasMany
    {
        return $this->hasMany(WisataAffiliateLink::class, 'affiliate_id');
    }

    public function commissionItems(): HasMany
    {
        return $this->hasMany(WisataAffiliateCommissionItem::class, 'affiliate_id');
    }

    public function payouts(): HasMany
    {
        return $this->hasMany(WisataAffiliatePayout::class, 'affiliate_id');
    }
}
