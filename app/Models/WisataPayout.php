<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WisataPayout extends Model
{
    use HasFactory;

    protected $fillable = [
        'mitra_wisata_onboarding_id',
        'period_start',
        'period_end',
        'total_gmv',
        'commission_amount',
        'net_payout',
        'status',
        'notes',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'total_gmv' => 'integer',
        'commission_amount' => 'integer',
        'net_payout' => 'integer',
    ];

    public function destination()
    {
        return $this->belongsTo(MitraWisataOnboarding::class, 'mitra_wisata_onboarding_id');
    }
}
