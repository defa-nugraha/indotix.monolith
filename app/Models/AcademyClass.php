<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AcademyClass extends Model
{
    protected $fillable = [
        'title',
        'description',
        'category',
        'start_at',
        'end_at',
        'duration_minutes',
        'location_type',
        'location_detail',
        'capacity_total',
        'capacity_sold',
        'status',
        'is_active',
    ];

    protected $casts = [
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function tickets(): HasMany
    {
        return $this->hasMany(AcademyTicket::class, 'academy_class_id');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(AcademyBooking::class, 'academy_class_id');
    }
}
