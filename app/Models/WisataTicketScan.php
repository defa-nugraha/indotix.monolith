<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WisataTicketScan extends Model
{
    use HasFactory;

    protected $fillable = [
        'wisata_booking_id',
        'scanned_at',
        'officer_name',
        'location',
        'is_anomaly',
    ];

    protected $casts = [
        'scanned_at' => 'datetime',
        'is_anomaly' => 'boolean',
    ];

    public function booking()
    {
        return $this->belongsTo(WisataBooking::class, 'wisata_booking_id');
    }
}
