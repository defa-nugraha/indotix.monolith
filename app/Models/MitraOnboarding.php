<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MitraOnboarding extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'current_step',
        'hotel_name',
        'property_type',
        'city_code',
        'address_short',
        'estimated_room_count',
        'responsible_name',
        'responsible_nik',
        'responsible_role',
        'ktp_path',
        'selfie_ktp_path',
        'legal_doc_type',
        'legal_doc_number',
        'legal_doc_path',
        'photo_front_path',
        'photo_lobby_path',
        'photo_room_path',
        'address_full',
        'maps_pin_url',
        'reception_phone',
        'operational_hours',
        'reservation_pic',
        'verification_status',
        'verification_reason',
        'bank_name',
        'bank_account_number',
        'bank_account_name',
        'tax_npwp',
        'tax_type',
        'payout_status',
        'payout_reason',
    ];

    protected function casts(): array
    {
        return [
            'estimated_room_count' => 'integer',
        ];
    }
}
