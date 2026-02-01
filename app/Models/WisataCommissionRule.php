<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WisataCommissionRule extends Model
{
    use HasFactory;

    protected $fillable = [
        'mitra_wisata_onboarding_id',
        'type',
        'value',
        'start_date',
        'end_date',
    ];

    protected $casts = [
        'value' => 'integer',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function destination()
    {
        return $this->belongsTo(MitraWisataOnboarding::class, 'mitra_wisata_onboarding_id');
    }
}
