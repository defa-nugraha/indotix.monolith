<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SpecialProgramFacility extends Model
{
    protected $fillable = [
        'special_program_id',
        'content',
        'sort_order',
    ];

    public function program(): BelongsTo
    {
        return $this->belongsTo(SpecialProgram::class, 'special_program_id');
    }
}
