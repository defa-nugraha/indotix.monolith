<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class SpecialProgram extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'program_type',
        'description_internal',
        'starts_at',
        'ends_at',
        'status',
        'is_active',
        'scope',
        'rules',
        'discount',
        'visibility',
        'budget',
        'compliance',
        'terms',
        'priority',
        'highlight_level',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'starts_at' => 'date',
        'ends_at' => 'date',
        'is_active' => 'boolean',
        'scope' => 'array',
        'rules' => 'array',
        'discount' => 'array',
        'visibility' => 'array',
        'budget' => 'array',
        'compliance' => 'array',
    ];

    protected static function booted(): void
    {
        static::saving(function (SpecialProgram $program): void {
            if (! $program->name) {
                return;
            }
            if (! $program->slug || $program->isDirty('name')) {
                $program->slug = self::generateUniqueSlug($program->name, $program->id);
            }
        });
    }

    public static function generateUniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        if ($base === '' || $base === 'booking') {
            $base = $base === '' ? 'program' : 'booking-program';
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

    public function items(): HasMany
    {
        return $this->hasMany(SpecialProgramItem::class);
    }
}
