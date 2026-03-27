<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SpecialProgramVariant extends Model
{
    protected $fillable = [
        'special_program_id',
        'name',
        'price',
        'capacity',
        'sort_order',
    ];

    protected $casts = [
        'price' => 'integer',
        'capacity' => 'integer',
    ];

    public function program(): BelongsTo
    {
        return $this->belongsTo(SpecialProgram::class, 'special_program_id');
    }
}
