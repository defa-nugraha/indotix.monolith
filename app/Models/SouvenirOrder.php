<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SouvenirOrder extends Model
{
    protected $fillable = [
        'user_id',
        'status',
        'payment_status',
        'total_price',
        'shipping_method',
        'shipping_address',
        'shipping_cost',
        'shipping_status',
        'tracking_number',
        'shipped_at',
        'completed_at',
        'payment_deadline',
    ];

    protected $casts = [
        'shipped_at' => 'datetime',
        'completed_at' => 'datetime',
        'payment_deadline' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(SouvenirOrderItem::class, 'souvenir_order_id');
    }

    public function refunds(): HasMany
    {
        return $this->hasMany(SouvenirRefund::class, 'souvenir_order_id');
    }
}
