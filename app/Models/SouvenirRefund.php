<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SouvenirRefund extends Model
{
    protected $fillable = [
        'souvenir_order_id',
        'type',
        'amount',
        'reason',
        'status',
        'resolved_at',
        'created_by',
    ];

    protected $casts = [
        'resolved_at' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(SouvenirOrder::class, 'souvenir_order_id');
    }
}
