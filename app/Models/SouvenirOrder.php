<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SouvenirOrder extends Model
{
    protected $fillable = [
        'user_id',
        'guest_name',
        'guest_email',
        'guest_phone',
        'status',
        'payment_status',
        'midtrans_order_id',
        'snap_token',
        'payment_type',
        'transaction_id',
        'payment_payload',
        'total_price',
        'shipping_method',
        'shipping_address',
        'notes',
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
        'payment_payload' => 'array',
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
