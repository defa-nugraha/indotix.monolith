<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AcademyAttendee extends Model
{
    protected $fillable = [
        'academy_booking_id',
        'name',
        'email',
        'phone',
        'attendance_status',
        'checked_in_at',
    ];

    protected $casts = [
        'checked_in_at' => 'datetime',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(AcademyBooking::class, 'academy_booking_id');
    }
}
