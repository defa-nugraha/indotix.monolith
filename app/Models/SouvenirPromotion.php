<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SouvenirPromotion extends Model
{
    protected $fillable = [
        'name',
        'type',
        'value',
        'is_active',
        'starts_at',
        'ends_at',
        'rules',
        'special_program_id',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'starts_at' => 'date',
        'ends_at' => 'date',
        'rules' => 'array',
    ];

    public function specialProgram(): BelongsTo
    {
        return $this->belongsTo(SpecialProgram::class, 'special_program_id');
    }
}
