<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Voucher extends Model
{
    protected $fillable = [
        'code',
        'discount_type',
        'discount_value',
        'min_transaction',
        'quota_total',
        'quota_used',
        'max_per_user_per_day',
        'starts_at',
        'ends_at',
        'hotel_id',
        'is_active',
    ];

    protected $casts = [
        'starts_at' => 'date',
        'ends_at' => 'date',
        'is_active' => 'boolean',
    ];

    public function hotel(): BelongsTo
    {
        return $this->belongsTo(Hotel::class);
    }

    public function wisataDestinations(): BelongsToMany
    {
        return $this->belongsToMany(
            MitraWisataOnboarding::class,
            'voucher_wisata_destination',
            'voucher_id',
            'mitra_wisata_onboarding_id',
        )->withTimestamps();
    }
}
