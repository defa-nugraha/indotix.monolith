<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SpecialProgramScan extends Model
{
    protected $fillable = [
        'special_program_booking_id',
        'special_program_variant_id',
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
        return $this->belongsTo(SpecialProgramBooking::class, 'special_program_booking_id');
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(SpecialProgramVariant::class, 'special_program_variant_id');
    }
}
