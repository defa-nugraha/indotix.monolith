<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Hotel extends Model
{
    protected $fillable = [
        'vendor_id',
        'name',
        'slug',
        'description',
        'city_id',
        'address',
        'latitude',
        'longitude',
        'star_rating',
        'check_in_time',
        'check_out_time',
        'status',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'star_rating' => 'integer',
    ];

    protected static function booted(): void
    {
        static::saving(function (Hotel $hotel): void {
            if (! $hotel->name) {
                return;
            }
            if (! $hotel->slug || $hotel->isDirty('name')) {
                $hotel->slug = self::generateUniqueSlug($hotel->name, $hotel->id);
            }
        });
    }

    public static function generateUniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        if ($base === '') {
            $base = 'hotel';
        }

        $candidate = $base;
        $suffix = 1;
        while (
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

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'vendor_id');
    }

    public function city(): BelongsTo
    {
        return $this->belongsTo(Regency::class, 'city_id', 'code');
    }

    public function roomTypes(): HasMany
    {
        return $this->hasMany(RoomType::class);
    }

    public function facilities(): HasMany
    {
        return $this->hasMany(HotelFacility::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(HotelImage::class);
    }
}
