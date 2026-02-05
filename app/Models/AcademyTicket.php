<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AcademyTicket extends Model
{
    protected $fillable = [
        'academy_class_id',
        'name',
        'price',
        'quota',
        'ticket_type',
        'refundable',
        'sales_start_at',
        'sales_end_at',
        'is_active',
        'sold_count',
    ];

    protected $casts = [
        'refundable' => 'boolean',
        'is_active' => 'boolean',
        'sales_start_at' => 'datetime',
        'sales_end_at' => 'datetime',
    ];

    public function academyClass(): BelongsTo
    {
        return $this->belongsTo(AcademyClass::class, 'academy_class_id');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(AcademyBooking::class, 'academy_ticket_id');
    }
}
