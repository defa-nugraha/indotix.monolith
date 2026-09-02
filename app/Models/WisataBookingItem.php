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
        'used_quantity',
        'unit_price',
        'subtotal',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'used_quantity' => 'integer',
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

    public function scans()
    {
        return $this->hasMany(WisataTicketScan::class, 'wisata_booking_item_id');
    }

    public function remainingQuantity(): int
    {
        return max(0, (int) $this->quantity - (int) $this->used_quantity);
    }
}
