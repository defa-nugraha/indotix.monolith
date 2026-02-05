<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AcademyScan extends Model
{
    protected $fillable = [
        'academy_booking_id',
        'academy_ticket_id',
        'scanned_at',
        'officer_name',
        'device',
        'is_anomaly',
    ];

    protected $casts = [
        'scanned_at' => 'datetime',
        'is_anomaly' => 'boolean',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(AcademyBooking::class, 'academy_booking_id');
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(AcademyTicket::class, 'academy_ticket_id');
    }
}
