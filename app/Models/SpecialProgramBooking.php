<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SpecialProgramBooking extends Model
{
    protected $fillable = [
        'user_id',
        'special_program_id',
        'special_program_variant_id',
        'item_type',
        'item_id',
        'item_name',
        'city_name',
        'visit_date',
        'ticket_name',
        'quantity',
        'unit_price',
        'total_price',
        'status',
        'payment_status',
        'payment_deadline',
        'guest_name',
        'guest_email',
        'guest_phone',
        'notes',
        'midtrans_order_id',
    ];

    protected $casts = [
        'payment_deadline' => 'datetime',
        'visit_date' => 'date',
    ];

    public function program(): BelongsTo
    {
        return $this->belongsTo(SpecialProgram::class, 'special_program_id');
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(SpecialProgramVariant::class, 'special_program_variant_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(SpecialProgramPayment::class, 'special_program_booking_id');
    }
}
