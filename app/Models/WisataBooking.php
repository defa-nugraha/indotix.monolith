<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WisataBooking extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'mitra_wisata_onboarding_id',
        'wisata_ticket_id',
        'booking_code',
        'visit_date',
        'quantity',
        'unit_price',
        'total_price',
        'status',
    ];

    protected $casts = [
        'visit_date' => 'date',
        'quantity' => 'integer',
        'unit_price' => 'integer',
        'total_price' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function destination()
    {
        return $this->belongsTo(MitraWisataOnboarding::class, 'mitra_wisata_onboarding_id');
    }

    public function ticket()
    {
        return $this->belongsTo(WisataTicket::class, 'wisata_ticket_id');
    }

    public function scans()
    {
        return $this->hasMany(WisataTicketScan::class);
    }
}
