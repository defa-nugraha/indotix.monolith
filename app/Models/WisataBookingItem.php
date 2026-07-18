<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WisataBookingItem extends Model
{
    protected $fillable = [
        'wisata_booking_id',
        'wisata_ticket_id',
        'ticket_name',
        'quantity',
        'unit_price',
        'subtotal',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'integer',
        'subtotal' => 'integer',
    ];

    public function booking()
    {
        return $this->belongsTo(WisataBooking::class, 'wisata_booking_id');
    }

    public function ticket()
    {
        return $this->belongsTo(WisataTicket::class, 'wisata_ticket_id');
    }
}
