<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WisataBooking extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'mitra_wisata_onboarding_id',
        'wisata_ticket_id',
        'booking_code',
        'visit_date',
        'quantity',
        'unit_price',
        'total_price',
        'status',
        'guest_name',
        'guest_email',
        'guest_phone',
        'special_request',
        'payment_status',
        'payment_deadline',
        'midtrans_order_id',
        'cancel_reason',
        'cancelled_at',
        'cancelled_by_admin_id',
        'refund_status',
        'refund_amount',
        'refund_reason',
        'refund_processed_at',
    ];

    protected $casts = [
        'visit_date' => 'date',
        'quantity' => 'integer',
        'unit_price' => 'integer',
        'total_price' => 'integer',
        'payment_deadline' => 'datetime',
        'cancelled_at' => 'datetime',
        'refund_processed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function destination()
    {
        return $this->belongsTo(MitraWisataOnboarding::class, 'mitra_wisata_onboarding_id');
    }

    public function ticket()
    {
        return $this->belongsTo(WisataTicket::class, 'wisata_ticket_id');
    }

    public function scans()
    {
        return $this->hasMany(WisataTicketScan::class);
    }

    public function disputes()
    {
        return $this->hasMany(WisataDispute::class, 'wisata_booking_id');
    }

    public function payments()
    {
        return $this->hasMany(WisataPayment::class, 'wisata_booking_id');
    }

    public function isExpired(): bool
    {
        return $this->status === 'pending_payment'
            && $this->payment_deadline
            && $this->payment_deadline->isPast();
    }
}
