<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SouvenirVariant extends Model
{
    protected $fillable = [
        'product_id',
        'variant_type',
        'name',
        'sku',
        'additional_price',
        'stock',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(SouvenirProduct::class, 'product_id');
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(SouvenirStockMovement::class, 'variant_id');
    }
}
