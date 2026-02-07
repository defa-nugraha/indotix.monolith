<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WisataAffiliateCommission extends Model
{
    protected $fillable = [
        'scope_type',
        'wisata_id',
        'campaign_id',
        'type',
        'value',
        'source',
        'start_date',
        'end_date',
        'created_by',
    ];
}
