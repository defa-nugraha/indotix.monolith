<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SouvenirProduct extends Model
{
    protected $fillable = [
        'category_id',
        'name',
        'description',
        'price',
        'cost_price',
        'sku',
        'weight',
        'length',
        'width',
        'height',
        'status',
        'is_active',
        'min_stock',
        'stock',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(SouvenirCategory::class, 'category_id');
    }

    public function variants(): HasMany
    {
        return $this->hasMany(SouvenirVariant::class, 'product_id');
    }

    public function images(): HasMany
    {
        return $this->hasMany(SouvenirProductImage::class, 'product_id');
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(SouvenirStockMovement::class, 'product_id');
    }
}
