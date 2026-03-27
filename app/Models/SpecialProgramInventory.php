<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SpecialProgramInventory extends Model
{
    protected $fillable = [
        'special_program_id',
        'date',
        'capacity',
    ];

    protected $casts = [
        'date' => 'date',
        'capacity' => 'integer',
    ];

    public function program(): BelongsTo
    {
        return $this->belongsTo(SpecialProgram::class, 'special_program_id');
    }
}
