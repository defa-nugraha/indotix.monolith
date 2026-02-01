<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WisataTicket extends Model
{
    use HasFactory;

    protected $fillable = [
        'mitra_wisata_onboarding_id',
        'name',
        'description',
        'price',
        'quota',
        'ticket_type',
        'daily_quota',
        'valid_from',
        'valid_until',
        'refund_policy',
        'max_quota_override',
        'is_active',
        'is_closed',
    ];

    protected $casts = [
        'price' => 'integer',
        'quota' => 'integer',
        'daily_quota' => 'integer',
        'max_quota_override' => 'integer',
        'is_active' => 'boolean',
        'is_closed' => 'boolean',
        'valid_from' => 'date',
        'valid_until' => 'date',
    ];

    public function destination()
    {
        return $this->belongsTo(MitraWisataOnboarding::class, 'mitra_wisata_onboarding_id');
    }

    public function bookings()
    {
        return $this->hasMany(WisataBooking::class, 'wisata_ticket_id');
    }
}
