<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WisataTicketScan extends Model
{
    use HasFactory;

    protected $fillable = [
        'wisata_booking_id',
        'wisata_booking_item_id',
        'user_id',
        'quantity',
        'scan_source',
        'scanned_at',
        'officer_name',
        'location',
        'is_anomaly',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'scanned_at' => 'datetime',
        'is_anomaly' => 'boolean',
    ];

    public function booking()
    {
        return $this->belongsTo(WisataBooking::class, 'wisata_booking_id');
    }

    public function item()
    {
        return $this->belongsTo(WisataBookingItem::class, 'wisata_booking_item_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
