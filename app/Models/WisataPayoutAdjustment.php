<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WisataPayoutAdjustment extends Model
{
    protected $fillable = [
        'mitra_wisata_onboarding_id',
        'wisata_booking_id',
        'wisata_refund_id',
        'amount',
        'applied_amount',
        'status',
        'applied_payout_id',
    ];

    protected $casts = [
        'amount' => 'integer',
        'applied_amount' => 'integer',
    ];

    public function destination(): BelongsTo
    {
        return $this->belongsTo(MitraWisataOnboarding::class, 'mitra_wisata_onboarding_id');
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(WisataBooking::class, 'wisata_booking_id');
    }

    public function refund(): BelongsTo
    {
        return $this->belongsTo(WisataRefund::class, 'wisata_refund_id');
    }

    public function appliedPayout(): BelongsTo
    {
        return $this->belongsTo(WisataPayout::class, 'applied_payout_id');
    }

    public function remainingAmount(): int
    {
        return max(0, (int) $this->amount - (int) $this->applied_amount);
    }
}
