<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

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
        'slug',
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
        'content_hidden',
        'content_hidden_reason',
        'photo_gate_hidden',
        'photo_area_hidden',
        'photo_ticket_hidden',
        'is_temporarily_closed',
        'closure_note',
    ];

    protected $casts = [
        'open_days' => 'array',
        'facilities' => 'array',
        'is_live' => 'boolean',
        'is_suspended' => 'boolean',
        'suspended_at' => 'datetime',
        'content_hidden' => 'boolean',
        'photo_gate_hidden' => 'boolean',
        'photo_area_hidden' => 'boolean',
        'photo_ticket_hidden' => 'boolean',
        'is_temporarily_closed' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::saving(function (MitraWisataOnboarding $destination): void {
            if (! $destination->destination_name) {
                return;
            }
            if (! $destination->slug || $destination->isDirty('destination_name')) {
                $destination->slug = self::generateUniqueSlug($destination->destination_name, $destination->id);
            }
        });
    }

    public static function generateUniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        if ($base === '' || in_array($base, ['booking', 'history'], true)) {
            if ($base === '') {
                $base = 'wisata';
            } else {
                $base = $base.'-wisata';
            }
        }

        $candidate = $base;
        $suffix = 1;
        while (
            in_array($candidate, ['booking', 'history'], true) ||
            self::query()
                ->where('slug', $candidate)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $suffix++;
            $candidate = $base.'-'.$suffix;
        }

        return $candidate;
    }

    public function tickets()
    {
        return $this->hasMany(WisataTicket::class);
    }

    public function staff()
    {
        return $this->hasMany(MitraWisataStaff::class, 'mitra_wisata_onboarding_id');
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
