<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MitraEventStaff extends Model
{
    protected $fillable = [
        'mitra_event_onboarding_id',
        'name',
        'email',
        'role',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function onboarding(): BelongsTo
    {
        return $this->belongsTo(MitraEventOnboarding::class, 'mitra_event_onboarding_id');
    }
}
