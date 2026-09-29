<?php

namespace App\Payments\Gateways;

use App\Models\SystemSetting;
use App\Models\WisataBooking;
use App\Models\WisataPayment;
use App\Payments\Contracts\PaymentGateway;
use App\Payments\PaymentGatewayResult;
use App\Services\MidtransService;

final readonly class MidtransPaymentGateway implements PaymentGateway
{
    public function __construct(private MidtransService $client) {}

    public function provider(): string
    {
        return 'midtrans';
    }

    public function create(WisataBooking $booking, WisataPayment $payment): PaymentGatewayResult
    {
        $raw = $this->client->snap($this->payload($booking, $payment->order_id));

        return $this->map($raw, 'pending');
    }

    public function status(WisataPayment $payment): ?PaymentGatewayResult
    {
        $raw = $this->client->statusOrNull($payment->order_id);

        return $raw === null ? null : $this->map($raw);
    }

    private function map(array $raw, ?string $fallback = null): PaymentGatewayResult
    {
        $providerStatus = (string) ($raw['transaction_status'] ?? $fallback ?? 'unknown');
        $internal = match ($providerStatus) {
            'settlement' => 'paid',
            'capture' => ($raw['fraud_status'] ?? 'accept') === 'accept' ? 'paid' : 'pending',
            'pending', 'authorize' => 'pending',
            'cancel' => 'cancelled',
            'expire' => 'expired',
            'deny', 'failure' => 'failed',
            'refund', 'partial_refund' => 'refunded',
            default => 'unknown',
        };

        return new PaymentGatewayResult(
            $internal,
            $providerStatus,
            isset($raw['transaction_id']) ? (string) $raw['transaction_id'] : null,
            null,
            isset($raw['payment_type']) ? (string) $raw['payment_type'] : 'snap',
            null,
            isset($raw['redirect_url']) ? (string) $raw['redirect_url'] : null,
            isset($raw['gross_amount']) ? (int) $raw['gross_amount'] : null,
            null,
            null,
            $raw,
        );
    }

    private function payload(WisataBooking $booking, string $orderId): array
    {
        $booking->loadMissing(['items.ticket', 'ticket']);
        $items = $booking->items->isNotEmpty()
            ? $booking->items->map(fn ($item) => [
                'id' => (string) $item->wisata_ticket_id,
                'price' => (int) $item->unit_price,
                'quantity' => (int) $item->quantity,
                'name' => $item->ticket_name ?: ($item->ticket?->name ?? 'Tiket Wisata'),
            ])->values()->all()
            : [[
                'id' => (string) $booking->wisata_ticket_id,
                'price' => (int) $booking->unit_price,
                'quantity' => (int) $booking->quantity,
                'name' => $booking->ticket?->name ?? 'Tiket Wisata',
            ]];

        if ((int) ($booking->discount_amount ?? 0) > 0) {
            $items[] = [
                'id' => 'VOUCHER-'.$booking->id,
                'price' => -1 * (int) $booking->discount_amount,
                'quantity' => 1,
                'name' => 'Diskon voucher '.($booking->voucher_code ?: ''),
            ];
        }

        $deadline = $booking->payment_deadline ?? now()->addMinutes(SystemSetting::wisataBookingTimeoutMinutes());
        $duration = max(1, (int) ceil(now()->diffInSeconds($deadline, false) / 60));

        return [
            'transaction_details' => ['order_id' => $orderId, 'gross_amount' => (int) $booking->total_price],
            'item_details' => $items,
            'customer_details' => [
                'first_name' => $booking->guest_name,
                'email' => $booking->guest_email,
                'phone' => $booking->guest_phone,
            ],
            'expiry' => ['duration' => $duration, 'unit' => 'minute'],
        ];
    }
}
