<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SouvenirStockMovement extends Model
{
    protected $fillable = [
        'product_id',
        'variant_id',
        'type',
        'quantity',
        'note',
        'created_by',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(SouvenirProduct::class, 'product_id');
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(SouvenirVariant::class, 'variant_id');
    }
}
