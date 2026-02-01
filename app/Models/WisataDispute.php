<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WisataDispute extends Model
{
    use HasFactory;

    protected $fillable = [
        'wisata_booking_id',
        'user_id',
        'mitra_wisata_onboarding_id',
        'wisata_ticket_id',
        'subject',
        'description',
        'status',
        'resolution',
    ];

    public function booking()
    {
        return $this->belongsTo(WisataBooking::class, 'wisata_booking_id');
    }

    public function destination()
    {
        return $this->belongsTo(MitraWisataOnboarding::class, 'mitra_wisata_onboarding_id');
    }

    public function ticket()
    {
        return $this->belongsTo(WisataTicket::class, 'wisata_ticket_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
