<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WisataCommissionRule extends Model
{
    use HasFactory;

    protected $fillable = [
        'mitra_wisata_onboarding_id',
        'type',
        'value',
        'start_date',
        'end_date',
        'is_forever',
    ];

    protected $casts = [
        'value' => 'integer',
        'start_date' => 'date',
        'end_date' => 'date',
        'is_forever' => 'boolean',
    ];

    public function destination()
    {
        return $this->belongsTo(MitraWisataOnboarding::class, 'mitra_wisata_onboarding_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
