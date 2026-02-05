<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SouvenirProductImage extends Model
{
    protected $fillable = [
        'product_id',
        'image_url',
        'sort_order',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(SouvenirProduct::class, 'product_id');
    }
}
