<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SearchLog extends Model
{
    protected $fillable = [
        'product_type',
        'keyword',
        'filters',
        'result_count',
        'user_id',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'filters' => 'array',
        'result_count' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
