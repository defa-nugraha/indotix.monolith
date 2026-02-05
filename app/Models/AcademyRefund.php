<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AcademyRefund extends Model
{
    protected $fillable = [
        'academy_booking_id',
        'admin_id',
        'amount',
        'reason',
        'status',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(AcademyBooking::class, 'academy_booking_id');
    }
}
