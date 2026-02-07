<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WisataAffiliateSetting extends Model
{
    protected $fillable = [
        'cookie_days',
        'attribution_model',
        'min_payout',
        'payout_cutoff_days',
    ];
}
