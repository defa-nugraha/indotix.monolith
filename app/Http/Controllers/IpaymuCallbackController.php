<?php

namespace App\Http\Controllers;

use App\Models\PaymentWebhookEvent;
use App\Models\WisataPayment;
use App\Payments\Gateways\IpaymuPaymentGateway;
use App\Payments\IpaymuCallbackVerifier;
use App\Payments\PaymentGatewayResult;
use App\Services\WisataPaymentLifecycleService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class IpaymuCallbackController extends Controller
{
    public function __invoke(
        Request $request,
        IpaymuCallbackVerifier $verifier,
        IpaymuPaymentGateway $gateway,
        WisataPaymentLifecycleService $payments,
    ): Response {
        $maxBytes = max(1024, (int) config('services.ipaymu.callback_max_bytes', 65536));
        if ((int) $request->server('CONTENT_LENGTH', 0) > $maxBytes || strlen($request->getContent()) > $maxBytes) {
            return response('Payload too large', 413);
        }

        $signature = trim((string) $request->header('X-Signature', ''));
        $timestamp = trim((string) $request->header('X-Timestamp', ''));
        $externalId = trim((string) $request->header('X-External-ID', ''));
        $payload = $request->all();

        if ($signature === '' || $timestamp === '' || $externalId === '') {
            Log::warning('iPaymu callback rejected: required headers missing.', [
                'event_type' => 'payment_callback_rejected',
                'provider' => 'ipaymu',
                'reason' => 'missing_headers',
            ]);

            return response('Invalid callback headers', 400);
        }

        if (! $verifier->validTimestamp($timestamp) || ! $verifier->verify($payload, $signature)) {
            Log::warning('iPaymu callback signature rejected.', [
                'event_type' => 'payment_callback_signature_invalid',
                'provider' => 'ipaymu',
                'external_id_hash' => hash('sha256', $externalId),
            ]);

            return response('Invalid signature', 400);
        }

        $normalized = $verifier->normalize($payload);
        $payloadHash = hash('sha256', $verifier->canonicalJson($payload));
        $eventKey = hash('sha256', $externalId);

        try {
            $this->assertMerchantAndEnvironment($normalized);
            $referenceId = $this->referenceId($normalized);
        } catch (Throwable $exception) {
            Log::warning('iPaymu callback identity rejected.', [
                'event_type' => 'payment_callback_rejected',
                'provider' => 'ipaymu',
                'reason' => 'invalid_identity',
                'external_id_hash' => $eventKey,
            ]);

            return response('Invalid callback identity', 400);
        }

        try {
            $event = $this->claimEvent(
                $eventKey,
                $externalId,
                $payloadHash,
                $referenceId,
                (string) ($normalized['trx_id'] ?? ''),
                $timestamp,
                $normalized['status_code'] ?? null,
            );
        } catch (QueryException $exception) {
            if (! in_array((string) $exception->getCode(), ['19', '23000', '23505'], true)) {
                throw $exception;
            }

            $event = $this->claimEvent(
                $eventKey,
                $externalId,
                $payloadHash,
                $referenceId,
                (string) ($normalized['trx_id'] ?? ''),
                $timestamp,
                $normalized['status_code'] ?? null,
            );
        }
        if ($event instanceof Response) {
            return $event;
        }

        try {
            $transactionId = (string) ($normalized['trx_id'] ?? '');
            if ($referenceId === '' || $transactionId === '') {
                throw new \RuntimeException('Callback reference or transaction ID is missing.');
            }

            $payment = WisataPayment::query()
                ->where('provider', 'ipaymu')
                ->where('order_id', $referenceId)
                ->first();
            if (! $payment) {
                $this->reject($event, 'payment_not_found');
                Log::critical('Verified iPaymu callback references an unknown payment.', [
                    'event_type' => 'payment_callback_unknown_reference',
                    'provider' => 'ipaymu',
                    'reference_hash' => hash('sha256', $referenceId),
                    'provider_transaction_id' => $transactionId,
                ]);

                return response('OK', 200);
            }

            $event->update(['wisata_payment_id' => $payment->id]);
            $callbackAmount = $this->integerAmount($normalized['amount'] ?? null);
            if ($callbackAmount === null || $callbackAmount !== (int) $payment->gross_amount) {
                $this->reject($event, 'callback_amount_mismatch');

                return response('OK', 200);
            }

            if ($payment->transaction_id && ! hash_equals((string) $payment->transaction_id, $transactionId)) {
                $this->reject($event, 'transaction_id_mismatch');

                return response('OK', 200);
            }

            $result = $gateway->statusByTransactionId($transactionId, $payment->payment_url);
            $this->assertInquiryIdentity($result, $payment, $referenceId, $transactionId);
            $result = new PaymentGatewayResult(
                $result->internalStatus,
                $result->providerStatus,
                $result->transactionId,
                (string) ($normalized['sid'] ?? $result->providerReferenceId),
                (string) ($normalized['via'] ?? $result->paymentType),
                (string) ($normalized['channel'] ?? $result->paymentChannel),
                $result->paymentUrl,
                $result->amount,
                $result->fee,
                $result->expiresAt,
                $result->raw,
            );

            $payments->handleIpaymuStatus($payment, $result);
            $event->update(['status' => 'processed', 'processed_at' => now()]);

            return response('OK', 200);
        } catch (Throwable $exception) {
            $event->update([
                'status' => 'retryable',
                'rejection_reason' => 'verification_or_processing_failed',
                'processed_at' => null,
            ]);
            Log::critical('Verified iPaymu callback could not be processed.', [
                'event_type' => 'payment_callback_processing_failed',
                'provider' => 'ipaymu',
                'webhook_event_id' => $event->id,
                'payment_id' => $event->wisata_payment_id,
                'error_type' => $exception::class,
                'error' => mb_substr($exception->getMessage(), 0, 300),
            ]);

            return response('Callback processing failed', 500);
        }
    }

    private function claimEvent(
        string $eventKey,
        string $externalId,
        string $payloadHash,
        string $referenceId,
        string $transactionId,
        string $timestamp,
        mixed $statusCode,
    ): PaymentWebhookEvent|Response {
        return DB::transaction(function () use (
            $eventKey,
            $externalId,
            $payloadHash,
            $referenceId,
            $transactionId,
            $timestamp,
            $statusCode,
        ) {
            $event = PaymentWebhookEvent::query()
                ->where('provider', 'ipaymu')
                ->where(function ($query) use ($eventKey, $payloadHash) {
                    $query->where('event_key', $eventKey)
                        ->orWhere('payload_hash', $payloadHash);
                })
                ->lockForUpdate()
                ->first();

            if ($event) {
                if (! hash_equals((string) $event->payload_hash, $payloadHash)) {
                    Log::critical('iPaymu external ID was reused with a different payload.', [
                        'event_type' => 'payment_callback_replay_mismatch',
                        'provider' => 'ipaymu',
                        'webhook_event_id' => $event->id,
                    ]);

                    return response('Callback replay mismatch', 409);
                }

                if (in_array($event->status, ['processed', 'rejected'], true)) {
                    return response('OK', 200);
                }

                if ($event->status === 'processing' && $event->updated_at?->gt(now()->subMinutes(2))) {
                    return response('Callback is being processed', 409);
                }

                $event->update([
                    'status' => 'processing',
                    'rejection_reason' => null,
                    'processed_at' => null,
                ]);

                return $event->fresh();
            }

            return PaymentWebhookEvent::query()->create([
                'provider' => 'ipaymu',
                'event_key' => $eventKey,
                'external_id' => mb_substr($externalId, 0, 255),
                'payload_hash' => $payloadHash,
                'reference_id' => mb_substr($referenceId, 0, 255),
                'provider_transaction_id' => mb_substr($transactionId, 0, 255),
                'status' => 'processing',
                'metadata' => [
                    'timestamp' => $timestamp,
                    'status_code' => $statusCode,
                ],
            ]);
        }, 3);
    }

    private function assertMerchantAndEnvironment(array $payload): void
    {
        $expectedVa = trim((string) config('services.ipaymu.va', ''));
        $merchant = trim((string) ($payload['merchant'] ?? ''));
        if ($expectedVa === '' || $merchant === '' || ! hash_equals($expectedVa, $merchant)) {
            throw new \RuntimeException('iPaymu callback merchant mismatch.');
        }

        if (array_key_exists('is_sandbox', $payload)) {
            $actualSandbox = filter_var($payload['is_sandbox'], FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE);
            $expectedSandbox = config('services.ipaymu.environment', 'sandbox') !== 'production';
            if ($actualSandbox === null || $actualSandbox !== $expectedSandbox) {
                throw new \RuntimeException('iPaymu callback environment mismatch.');
            }
        }
    }

    private function assertInquiryIdentity(
        PaymentGatewayResult $result,
        WisataPayment $payment,
        string $referenceId,
        string $transactionId,
    ): void {
        if ($result->transactionId === null || ! hash_equals($transactionId, $result->transactionId)) {
            throw new \RuntimeException('iPaymu inquiry transaction mismatch.');
        }
        if ($result->amount === null || $result->amount !== (int) $payment->gross_amount) {
            throw new \RuntimeException('iPaymu inquiry amount mismatch.');
        }

        $inquiryReference = trim((string) ($result->raw['Data']['ReferenceId'] ?? ''));
        if ($inquiryReference !== '' && ! hash_equals($referenceId, $inquiryReference)) {
            throw new \RuntimeException('iPaymu inquiry reference mismatch.');
        }
    }

    private function referenceId(array $payload): string
    {
        $snake = trim((string) ($payload['reference_id'] ?? ''));
        $camel = trim((string) ($payload['referenceId'] ?? ''));
        if ($snake !== '' && $camel !== '' && ! hash_equals($snake, $camel)) {
            throw new \RuntimeException('Conflicting iPaymu callback references.');
        }

        return $snake !== '' ? $snake : $camel;
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

    private function reject(PaymentWebhookEvent $event, string $reason): void
    {
        $event->update([
            'status' => 'rejected',
            'rejection_reason' => $reason,
            'processed_at' => now(),
        ]);
    }
}
