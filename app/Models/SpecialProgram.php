<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SpecialProgram extends Model
{
    protected $fillable = [
        'name',
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

    public function items(): HasMany
    {
        return $this->hasMany(SpecialProgramItem::class);
    }
}
