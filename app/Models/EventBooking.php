<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EventBooking extends Model
{
    protected $fillable = [
        'user_id',
        'event_id',
        'event_ticket_id',
        'booking_code',
        'quantity',
        'total_price',
        'status',
        'payment_status',
        'payment_deadline',
        'guest_name',
        'guest_email',
        'guest_phone',
        'midtrans_order_id',
    ];

    protected $casts = [
        'payment_deadline' => 'datetime',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(EventTicket::class, 'event_ticket_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function attendees(): HasMany
    {
        return $this->hasMany(EventAttendee::class);
    }

    public function scans(): HasMany
    {
        return $this->hasMany(EventScan::class);
    }
}
