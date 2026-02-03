<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventSetting extends Model
{
    protected $fillable = [
        'booking_timeout_minutes',
        'max_ticket_per_user',
        'sales_cutoff_minutes',
        'refund_policy',
    ];
}
