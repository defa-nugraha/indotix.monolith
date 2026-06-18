<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MobileErrorLog extends Model
{
    protected $fillable = [
        'user_id',
        'message',
        'exception_type',
        'stack_trace',
        'context',
        'source',
        'platform',
        'app_version',
        'build_number',
        'device',
        'extra',
        'fatal',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'device' => 'array',
        'extra' => 'array',
        'fatal' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
