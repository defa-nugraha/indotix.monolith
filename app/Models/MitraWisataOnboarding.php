<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MitraWisataOnboarding extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'current_step',
        'responsible_name',
        'responsible_phone',
        'responsible_role',
        'destination_name',
        'destination_type',
        'description',
        'highlights',
        'province_code',
        'city_code',
        'address_full',
        'maps_pin_url',
        'open_days',
        'open_time',
        'close_time',
        'holiday_notes',
        'facilities',
        'photo_gate_path',
        'photo_area_path',
        'photo_ticket_path',
        'contact_phone',
        'contact_hours',
        'ktp_path',
        'selfie_ktp_path',
        'legal_doc_type',
        'legal_doc_number',
        'legal_doc_path',
        'bank_name',
        'bank_account_number',
        'bank_account_name',
        'verification_status',
        'verification_reason',
        'payout_status',
        'payout_reason',
        'is_live',
        'is_suspended',
        'suspended_reason',
        'suspended_at',
    ];

    protected $casts = [
        'open_days' => 'array',
        'facilities' => 'array',
        'is_live' => 'boolean',
        'is_suspended' => 'boolean',
        'suspended_at' => 'datetime',
    ];

    public function tickets()
    {
        return $this->hasMany(WisataTicket::class);
    }

    public function bookings()
    {
        return $this->hasMany(WisataBooking::class, 'mitra_wisata_onboarding_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
