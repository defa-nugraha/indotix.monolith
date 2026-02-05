<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AcademyBooking extends Model
{
    protected $fillable = [
        'user_id',
        'academy_class_id',
        'academy_ticket_id',
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

    public function academyClass(): BelongsTo
    {
        return $this->belongsTo(AcademyClass::class, 'academy_class_id');
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(AcademyTicket::class, 'academy_ticket_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function attendees(): HasMany
    {
        return $this->hasMany(AcademyAttendee::class, 'academy_booking_id');
    }

    public function scans(): HasMany
    {
        return $this->hasMany(AcademyScan::class, 'academy_booking_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(AcademyPayment::class, 'academy_booking_id');
    }
}
