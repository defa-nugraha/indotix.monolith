<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WisataAffiliateCampaign extends Model
{
    protected $fillable = [
        'name',
        'description',
        'start_date',
        'end_date',
        'status',
        'bonus_type',
        'bonus_value',
        'leaderboard_enabled',
    ];
}
