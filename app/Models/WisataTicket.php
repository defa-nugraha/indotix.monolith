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
        'max_quota_override',
        'is_active',
    ];

    protected $casts = [
        'price' => 'integer',
        'quota' => 'integer',
        'max_quota_override' => 'integer',
        'is_active' => 'boolean',
    ];

    public function destination()
    {
        return $this->belongsTo(MitraWisataOnboarding::class, 'mitra_wisata_onboarding_id');
    }
}
