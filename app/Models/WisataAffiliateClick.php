<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WisataAffiliateClick extends Model
{
    protected $fillable = [
        'affiliate_link_id',
        'user_id',
        'ip',
        'user_agent',
    ];

    public function link(): BelongsTo
    {
        return $this->belongsTo(WisataAffiliateLink::class, 'affiliate_link_id');
    }
}
