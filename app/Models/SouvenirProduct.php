<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class SouvenirProduct extends Model
{
    protected $fillable = [
        'category_id',
        'name',
        'slug',
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

    protected static function booted(): void
    {
        static::creating(function (SouvenirProduct $product): void {
            if (! $product->slug) {
                $product->slug = self::generateUniqueSlug($product->name);
            }
        });

        static::updating(function (SouvenirProduct $product): void {
            if (! $product->slug && $product->name) {
                $product->slug = self::generateUniqueSlug($product->name, $product->id);
            }
        });
    }

    public static function generateUniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        if ($base === '') {
            $base = 'produk';
        }
        if (in_array($base, ['cart', 'checkout', 'booking'], true)) {
            $base .= '-produk';
        }

        $candidate = $base;
        $suffix = 1;
        while (
            self::query()
                ->where('slug', $candidate)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $suffix++;
            $candidate = $base.'-'.$suffix;
        }

        return $candidate;
    }

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

    public function orderItems(): HasMany
    {
        return $this->hasMany(SouvenirOrderItem::class, 'product_id');
    }
}
