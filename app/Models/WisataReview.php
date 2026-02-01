<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WisataReview extends Model
{
    use HasFactory;

    protected $fillable = [
        'mitra_wisata_onboarding_id',
        'user_id',
        'rating',
        'comment',
        'status',
        'flag_reason',
    ];

    protected $casts = [
        'rating' => 'integer',
    ];

    public function destination()
    {
        return $this->belongsTo(MitraWisataOnboarding::class, 'mitra_wisata_onboarding_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
