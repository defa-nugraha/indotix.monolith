<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Event extends Model
{
    protected $fillable = [
        'event_organizer_id',
        'title',
        'description',
        'city_code',
        'location',
        'address',
        'start_at',
        'end_at',
        'status',
        'capacity_total',
        'capacity_sold',
        'sales_stopped',
        'status_reason',
        'published_at',
    ];

    protected $casts = [
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'published_at' => 'datetime',
        'sales_stopped' => 'boolean',
    ];

    public function organizer(): BelongsTo
    {
        return $this->belongsTo(EventOrganizer::class, 'event_organizer_id');
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(EventTicket::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(EventBooking::class);
    }
}
