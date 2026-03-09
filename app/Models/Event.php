<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string|null $title
 * @property string|null $city_code
 * @property string|null $location
 * @property string|null $address
 * @property \Carbon\Carbon|null $start_at
 * @property \Carbon\Carbon|null $end_at
 * @property int|null $capacity_total
 * @property int|null $capacity_sold
 */
class Event extends Model
{
    protected $fillable = [
        'event_organizer_id',
        'title',
        'slug',
        'description',
        'city_code',
        'location',
        'address',
        'start_at',
        'end_at',
        'status',
        'capacity_total',
        'capacity_sold',
        'sales_stopped',
        'status_reason',
        'published_at',
    ];

    protected $casts = [
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'published_at' => 'datetime',
        'sales_stopped' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::saving(function (Event $event): void {
            if (! $event->title) {
                return;
            }
            if (! $event->slug || $event->isDirty('title')) {
                $event->slug = self::generateUniqueSlug($event->title, $event->id);
            }
        });
    }

    public static function generateUniqueSlug(string $title, ?int $ignoreId = null): string
    {
        $base = Str::slug($title);
        if ($base === '' || $base === 'booking') {
            $base = $base === '' ? 'event' : 'booking-event';
        }

        $candidate = $base;
        $suffix = 1;
        while (
            in_array($candidate, ['booking'], true) ||
            self::query()
                ->where('slug', $candidate)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $suffix++;
            $candidate = $base.'-'.$suffix;
        }

        return $candidate;
    }

    public function organizer(): BelongsTo
    {
        return $this->belongsTo(EventOrganizer::class, 'event_organizer_id');
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(EventTicket::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(EventBooking::class);
    }
}
