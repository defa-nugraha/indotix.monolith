<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventScan extends Model
{
    protected $fillable = [
        'event_booking_id',
        'event_ticket_id',
        'scanned_at',
        'officer_name',
        'location',
        'is_anomaly',
    ];

    protected $casts = [
        'scanned_at' => 'datetime',
        'is_anomaly' => 'boolean',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(EventBooking::class, 'event_booking_id');
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(EventTicket::class, 'event_ticket_id');
    }
}
