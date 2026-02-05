<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AcademySetting extends Model
{
    protected $fillable = [
        'booking_timeout_minutes',
        'cutoff_minutes',
        'refund_policy',
    ];
}
