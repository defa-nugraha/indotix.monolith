<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SouvenirOrderItem extends Model
{
    protected $fillable = [
        'souvenir_order_id',
        'product_id',
        'variant_id',
        'product_name',
        'sku',
        'unit_price',
        'quantity',
        'subtotal',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(SouvenirOrder::class, 'souvenir_order_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(SouvenirProduct::class, 'product_id');
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(SouvenirVariant::class, 'variant_id');
    }
}
