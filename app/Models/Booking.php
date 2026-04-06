<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'hotel_id',
        'voucher_id',
        'voucher_code',
        'check_in',
        'check_out',
        'nights',
        'rooms_count',
        'guests_count',
        'children_count',
        'children_ages',
        'extra_adults',
        'extra_children',
        'extra_beds',
        'extra_adult_fee',
        'extra_child_fee',
        'extra_bed_fee',
        'currency',
        'subtotal',
        'discount_type',
        'discount_value',
        'discount_amount',
        'service_fee',
        'tax_total',
        'tax_details',
        'total',
        'status',
        'payment_deadline',
        'guest_name',
        'guest_email',
        'guest_phone',
        'special_request',
        'internal_notes',
        'stay_status',
        'checked_in_at',
        'checked_out_at',
        'no_show_at',
        'midtrans_order_id',
        'payment_status',
    ];

    protected $casts = [
        'check_in' => 'date',
        'check_out' => 'date',
        'payment_deadline' => 'datetime',
        'checked_in_at' => 'datetime',
        'checked_out_at' => 'datetime',
        'no_show_at' => 'datetime',
        'subtotal' => 'integer',
        'discount_value' => 'integer',
        'discount_amount' => 'integer',
        'service_fee' => 'integer',
        'tax_total' => 'integer',
        'tax_details' => 'array',
        'total' => 'integer',
        'nights' => 'integer',
        'rooms_count' => 'integer',
        'guests_count' => 'integer',
        'children_count' => 'integer',
        'children_ages' => 'array',
        'extra_adults' => 'integer',
        'extra_children' => 'integer',
        'extra_beds' => 'integer',
        'extra_adult_fee' => 'integer',
        'extra_child_fee' => 'integer',
        'extra_bed_fee' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function hotel(): BelongsTo
    {
        return $this->belongsTo(Hotel::class);
    }

    public function rooms(): HasMany
    {
        return $this->hasMany(BookingRoom::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(BookingAuditLog::class);
    }

    public function isExpired(): bool
    {
        return $this->status === 'pending_payment'
            && $this->payment_deadline
            && $this->payment_deadline->isPast();
    }

    public function markExpired(): void
    {
        $this->status = 'expired';
        $this->payment_status = 'expired';
        $this->save();
    }

    public function setDeadlineMinutes(int $minutes): void
    {
        $this->payment_deadline = Carbon::now()->addMinutes($minutes);
    }
}
