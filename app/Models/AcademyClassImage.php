<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AcademyClassImage extends Model
{
    protected $fillable = [
        'academy_class_id',
        'image_path',
    ];

    public function academyClass(): BelongsTo
    {
        return $this->belongsTo(AcademyClass::class, 'academy_class_id');
    }
}
