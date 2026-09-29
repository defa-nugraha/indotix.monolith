<?php

namespace App\Payments\Gateways;

use App\Exceptions\PaymentGatewayException;
use App\Models\WisataBooking;
use App\Models\WisataPayment;
use App\Payments\Contracts\PaymentGateway;
use App\Payments\PaymentGatewayResult;
use App\Services\IpaymuService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\URL;

final readonly class IpaymuPaymentGateway implements PaymentGateway
{
    public function __construct(private IpaymuService $client) {}

    public function provider(): string
    {
        return 'ipaymu';
    }

    public function create(WisataBooking $booking, WisataPayment $payment): PaymentGatewayResult
    {
        $expiryHours = max(1, min(24, (int) config('services.ipaymu.payment_expiry_hours', 1)));
        $feeDirection = strtoupper((string) config('services.ipaymu.fee_direction', 'MERCHANT'));
        if ($feeDirection !== 'MERCHANT') {
            throw new PaymentGatewayException(
                'IPAYMU_FEE_DIRECTION must remain MERCHANT until buyer-fee amount semantics are contractually verified.',
            );
        }

        $returnUrl = URL::temporarySignedRoute(
            'payments.ipaymu.return',
            now()->addHours($expiryHours + 24),
            ['reference' => $payment->order_id],
        );

        $raw = $this->client->redirectPayment([
            'product' => ['Tiket Wisata '.($booking->destination?->destination_name ?? $booking->booking_code)],
            'qty' => ['1'],
            'price' => [(string) ((int) $booking->total_price)],
            'description' => ['Booking '.$booking->booking_code],
            'returnUrl' => $returnUrl,
            'notifyUrl' => route('payments.ipaymu.callback'),
            'cancelUrl' => $returnUrl,
            'referenceId' => $payment->order_id,
            'buyerName' => $booking->guest_name,
            'buyerEmail' => $booking->guest_email,
            'buyerPhone' => $booking->guest_phone,
            'expired' => $expiryHours,
            'feeDirection' => $feeDirection,
            'lang' => 'id',
        ]);

        $data = $raw['Data'];
        $paymentUrl = trim((string) ($data['Url'] ?? ''));
        $this->assertPaymentUrl($paymentUrl);

        return new PaymentGatewayResult(
            'pending',
            '0',
            null,
            isset($data['SessionID']) ? (string) $data['SessionID'] : null,
            'redirect',
            null,
            $paymentUrl,
            (int) $booking->total_price,
            null,
            CarbonImmutable::now()->addHours($expiryHours),
            $raw,
        );
    }

    public function status(WisataPayment $payment): ?PaymentGatewayResult
    {
        if (! $payment->transaction_id) {
            return null;
        }

        return $this->statusByTransactionId((string) $payment->transaction_id, $payment->payment_url);
    }

    public function statusByTransactionId(string $transactionId, ?string $paymentUrl = null): PaymentGatewayResult
    {
        $raw = $this->client->transaction($transactionId);
        $data = $raw['Data'];
        $statusCode = filter_var($data['Status'] ?? null, FILTER_VALIDATE_INT, FILTER_NULL_ON_FAILURE);
        $internalStatus = match ($statusCode) {
            0 => 'pending',
            1, 6 => 'paid',
            7 => 'unknown',
            2 => 'cancelled',
            3 => 'refunded',
            4, 5 => 'failed',
            -2 => 'expired',
            default => 'unknown',
        };

        return new PaymentGatewayResult(
            $internalStatus,
            $statusCode === null ? 'unknown' : (string) $statusCode,
            isset($data['TransactionId']) ? (string) $data['TransactionId'] : null,
            isset($data['SessionId']) ? (string) $data['SessionId'] : null,
            isset($data['TypeDesc']) ? (string) $data['TypeDesc'] : null,
            null,
            $paymentUrl,
            $this->integerAmount($data['Amount'] ?? null),
            $this->integerAmount($data['Fee'] ?? null),
            isset($data['ExpiredDate']) && $data['ExpiredDate']
                ? CarbonImmutable::parse((string) $data['ExpiredDate'], config('app.timezone'))
                : null,
            $raw,
        );
    }

    private function assertPaymentUrl(string $url): void
    {
        $parts = parse_url($url);
        $expectedHost = config('services.ipaymu.environment') === 'production'
            ? 'my.ipaymu.com'
            : 'sandbox.ipaymu.com';

        if (
            ! is_array($parts)
            || ($parts['scheme'] ?? null) !== 'https'
            || strtolower((string) ($parts['host'] ?? '')) !== $expectedHost
        ) {
            throw new PaymentGatewayException('iPaymu returned an untrusted payment URL.');
        }
    }

    private function integerAmount(mixed $value): ?int
    {
        if (is_int($value)) {
            return $value >= 0 ? $value : null;
        }

        if (! is_string($value) || preg_match('/\A[0-9]+\z/', $value) !== 1) {
            return null;
        }

        return (int) $value;
    }
}
