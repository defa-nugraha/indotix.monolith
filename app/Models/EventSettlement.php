<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventSettlement extends Model
{
    protected $fillable = [
        'event_organizer_id',
        'period_start',
        'period_end',
        'total_sales',
        'commission_amount',
        'net_payout',
        'status',
        'approved_at',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'approved_at' => 'datetime',
    ];

    public function organizer(): BelongsTo
    {
        return $this->belongsTo(EventOrganizer::class, 'event_organizer_id');
    }
}
