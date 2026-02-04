<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SpecialProgramItem extends Model
{
    protected $fillable = [
        'special_program_id',
        'item_type',
        'item_id',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function program(): BelongsTo
    {
        return $this->belongsTo(SpecialProgram::class, 'special_program_id');
    }
}
