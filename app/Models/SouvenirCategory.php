<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SouvenirCategory extends Model
{
    protected $fillable = [
        'name',
        'parent_id',
        'sort_order',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(SouvenirCategory::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(SouvenirCategory::class, 'parent_id');
    }

    public function products(): HasMany
    {
        return $this->hasMany(SouvenirProduct::class, 'category_id');
    }
}
