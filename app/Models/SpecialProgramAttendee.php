<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SpecialProgramAttendee extends Model
{
    protected $fillable = [
        'special_program_booking_id',
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
        return $this->belongsTo(SpecialProgramBooking::class, 'special_program_booking_id');
    }
}
