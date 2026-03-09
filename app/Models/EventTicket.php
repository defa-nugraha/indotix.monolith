<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $event_id
 * @property string|null $name
 * @property string|null $description
 * @property int $price
 * @property int|null $quota
 * @property int $sold_count
 * @property bool $is_active
 */
class EventTicket extends Model
{
    protected $fillable = [
        'event_id',
        'name',
        'description',
        'price',
        'benefits',
        'is_active',
        'max_per_user',
        'quota',
        'sold_count',
    ];

    protected $casts = [
        'benefits' => 'array',
        'is_active' => 'boolean',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(EventBooking::class);
    }
}
