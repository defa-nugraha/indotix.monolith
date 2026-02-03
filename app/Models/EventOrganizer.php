<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventOrganizer extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'email',
        'phone',
        'status',
        'notes',
        'documents',
    ];

    protected $casts = [
        'documents' => 'array',
    ];

    public function onboarding(): BelongsTo
    {
        return $this->belongsTo(MitraEventOnboarding::class, 'user_id', 'user_id');
    }

    public function events(): HasMany
    {
        return $this->hasMany(Event::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
