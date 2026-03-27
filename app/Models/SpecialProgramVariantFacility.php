<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SpecialProgramVariantFacility extends Model
{
    protected $fillable = [
        'special_program_variant_id',
        'content',
        'sort_order',
    ];

    public function variant(): BelongsTo
    {
        return $this->belongsTo(SpecialProgramVariant::class, 'special_program_variant_id');
    }
}
