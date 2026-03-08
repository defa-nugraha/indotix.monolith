<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class AcademyClass extends Model
{
    protected $fillable = [
        'title',
        'slug',
        'description',
        'category',
        'start_at',
        'end_at',
        'duration_minutes',
        'location_type',
        'location_detail',
        'capacity_total',
        'capacity_sold',
        'status',
        'is_active',
    ];

    protected $casts = [
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::saving(function (AcademyClass $class): void {
            if (! $class->title) {
                return;
            }
            if (! $class->slug || $class->isDirty('title')) {
                $class->slug = self::generateUniqueSlug($class->title, $class->id);
            }
        });
    }

    public static function generateUniqueSlug(string $title, ?int $ignoreId = null): string
    {
        $base = Str::slug($title);
        if ($base === '' || $base === 'booking') {
            $base = $base === '' ? 'academy' : 'booking-academy';
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

    public function tickets(): HasMany
    {
        return $this->hasMany(AcademyTicket::class, 'academy_class_id');
    }

    public function images(): HasMany
    {
        return $this->hasMany(AcademyClassImage::class, 'academy_class_id');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(AcademyBooking::class, 'academy_class_id');
    }
}
