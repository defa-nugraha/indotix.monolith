<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SystemSetting extends Model
{
    protected $fillable = [
        'key',
        'value',
        'type',
        'updated_by',
    ];

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public static function wisataBookingTimeoutMinutes(): int
    {
        $minutes = static::query()
            ->where('key', 'wisata_booking_timeout_minutes')
            ->value('value');

        return min(1440, max(1, (int) ($minutes ?? 15)));
    }
}
