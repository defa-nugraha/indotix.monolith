<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int $mitra_wisata_onboarding_id
 * @property string|null $name
 * @property string|null $description
 * @property int $price
 * @property int|null $quota
 * @property int|null $daily_quota
 * @property string|null $ticket_type
 * @property string|null $ticket_kind
 * @property bool $is_entry_ticket
 * @property array<int, array<string, int>>|null $package_items
 * @property string|null $refund_policy
 * @property int $min_order_quantity
 * @property int|null $max_order_quantity
 * @property bool $is_active
 * @property bool $is_closed
 */
class WisataTicket extends Model
{
    use HasFactory;

    protected $fillable = [
        'mitra_wisata_onboarding_id',
        'name',
        'description',
        'price',
        'quota',
        'ticket_type',
        'ticket_kind',
        'is_entry_ticket',
        'package_items',
        'daily_quota',
        'valid_from',
        'valid_until',
        'refund_policy',
        'max_quota_override',
        'min_order_quantity',
        'max_order_quantity',
        'is_active',
        'is_closed',
    ];

    protected $casts = [
        'price' => 'integer',
        'quota' => 'integer',
        'daily_quota' => 'integer',
        'max_quota_override' => 'integer',
        'min_order_quantity' => 'integer',
        'max_order_quantity' => 'integer',
        'package_items' => 'array',
        'is_entry_ticket' => 'boolean',
        'is_active' => 'boolean',
        'is_closed' => 'boolean',
        'valid_from' => 'date',
        'valid_until' => 'date',
    ];

    public function destination()
    {
        return $this->belongsTo(MitraWisataOnboarding::class, 'mitra_wisata_onboarding_id');
    }

    public function bookings()
    {
        return $this->hasMany(WisataBooking::class, 'wisata_ticket_id');
    }

    public function bookingItems()
    {
        return $this->hasMany(WisataBookingItem::class, 'wisata_ticket_id');
    }
}
