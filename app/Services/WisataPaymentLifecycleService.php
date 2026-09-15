<?php

namespace App\Services;

use App\Exceptions\PaymentGatewayException;
use App\Jobs\SendPushNotificationJob;
use App\Mail\WisataTicketMail;
use App\Models\SystemSetting;
use App\Models\UserNotification;
use App\Models\WisataAffiliateCommissionItem;
use App\Models\WisataBooking;
use App\Models\WisataPayment;
use App\Models\WisataRefund;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class WisataPaymentLifecycleService
{
    private const ACTIVE_PAYMENT_STATUSES = [
        'initiating',
        'pending',
        'unknown',
        'cancellation_pending',
        'cancellation_unknown',
        'expiry_pending',
        'expiry_unknown',
    ];

    public function __construct(
        private readonly MidtransService $midtrans,
        private readonly WisataFinanceService $finance,
    ) {}

    public function createOrGetSnapPayment(WisataBooking $booking): WisataPayment
    {
        $reservation = DB::transaction(function () use ($booking) {
            $locked = WisataBooking::query()->whereKey($booking->id)->lockForUpdate()->firstOrFail();

            if ($locked->isExpired()) {
                throw new RuntimeException('Booking sudah kedaluwarsa.');
            }

            if ($locked->status !== 'pending_payment') {
                throw new RuntimeException('Booking tidak berada pada status menunggu pembayaran.');
            }

            $existing = $locked->payments()
                ->where(function ($query) {
                    $query->whereNotNull('active_key')
                        ->orWhereIn('status', self::ACTIVE_PAYMENT_STATUSES);
                })
                ->latest('id')
                ->first();

            if ($existing) {
                if (! $existing->active_key && in_array($existing->status, self::ACTIVE_PAYMENT_STATUSES, true)) {
                    $existing->active_key = $this->activeKey($locked);
                    $existing->save();
                }

                return ['payment' => $existing, 'created' => false];
            }

            $payment = WisataPayment::query()->create([
                'wisata_booking_id' => $locked->id,
                'provider' => 'midtrans',
                'status' => 'initiating',
                'gross_amount' => (int) $locked->total_price,
                'payment_type' => 'snap',
                'order_id' => sprintf('WISATA-%s-%s', $locked->id, Str::ulid()),
                'active_key' => $this->activeKey($locked),
            ]);

            $locked->update([
                'midtrans_order_id' => $payment->order_id,
                'payment_status' => 'initiating',
            ]);

            return ['payment' => $payment, 'created' => true];
        }, 3);

        /** @var WisataPayment $payment */
        $payment = $reservation['payment'];

        if (! $reservation['created']) {
            return $payment->fresh();
        }

        $booking = $payment->booking()->with(['items.ticket', 'ticket'])->firstOrFail();
        $payload = $this->buildSnapPayload($booking, $payment->order_id);

        try {
            $snap = $this->midtrans->snap($payload);
        } catch (Throwable $exception) {
            DB::transaction(function () use ($payment, $exception) {
                $lockedPayment = WisataPayment::query()->whereKey($payment->id)->lockForUpdate()->firstOrFail();
                $lockedPayment->update([
                    'status' => 'unknown',
                    'last_gateway_error' => $this->safeError($exception),
                ]);
                $lockedPayment->booking()->update(['payment_status' => 'unknown']);
            }, 3);

            throw $exception;
        }

        return DB::transaction(function () use ($payment, $snap) {
            $lockedPayment = WisataPayment::query()->whereKey($payment->id)->lockForUpdate()->firstOrFail();
            $booking = WisataBooking::query()->whereKey($lockedPayment->wisata_booking_id)->lockForUpdate()->firstOrFail();

            if ($booking->status !== 'pending_payment') {
                throw new RuntimeException('Booking berubah status saat transaksi pembayaran dibuat.');
            }

            $lockedPayment->update([
                'status' => 'pending',
                'transaction_id' => $snap['transaction_id'] ?? $lockedPayment->transaction_id,
                'payload' => $snap,
                'last_gateway_error' => null,
            ]);

            $booking->update([
                'midtrans_order_id' => $lockedPayment->order_id,
                'payment_status' => 'pending',
            ]);

            return $lockedPayment->fresh();
        }, 3);
    }

    public function cancelBooking(WisataBooking $booking, ?string $reason = null, ?int $adminId = null): WisataBooking
    {
        $context = DB::transaction(function () use ($booking) {
            $locked = WisataBooking::query()->whereKey($booking->id)->lockForUpdate()->firstOrFail();

            if ($locked->status !== 'pending_payment') {
                throw new RuntimeException('Booking ini tidak dapat dibatalkan dari status saat ini.');
            }

            $payment = $locked->payments()
                ->where('provider', 'midtrans')
                ->latest('id')
                ->lockForUpdate()
                ->first();

            if (! $payment) {
                return ['booking' => $locked, 'payment' => null];
            }

            $payment->update(['status' => 'cancellation_pending']);
            $locked->update(['payment_status' => 'cancellation_pending']);

            return ['booking' => $locked, 'payment' => $payment];
        }, 3);

        if (! $context['payment']) {
            return $this->finalizeCancellation($context['booking']->id, $reason, $adminId);
        }

        /** @var WisataPayment $payment */
        $payment = $context['payment'];

        try {
            $status = $this->midtrans->statusOrNull($payment->order_id);

            if ($status === null) {
                return $this->finalizeCancellation($booking->id, $reason, $adminId, $payment->id, 'cancel');
            }

            if ($this->providerPaymentSucceeded($status)) {
                $this->applyProviderPayload($payment, $status);
                throw new RuntimeException('Pembayaran sudah berhasil dan booking tidak dapat dibatalkan.');
            }

            $transactionStatus = (string) ($status['transaction_status'] ?? '');
            if (in_array($transactionStatus, ['cancel', 'expire', 'deny'], true)) {
                return $this->finalizeCancellation($booking->id, $reason, $adminId, $payment->id, $transactionStatus);
            }

            $response = $this->midtrans->cancel($payment->order_id);
            $finalStatus = (string) ($response['transaction_status'] ?? 'cancel');

            return $this->finalizeCancellation($booking->id, $reason, $adminId, $payment->id, $finalStatus, $response);
        } catch (RuntimeException $exception) {
            if ($exception->getMessage() === 'Pembayaran sudah berhasil dan booking tidak dapat dibatalkan.') {
                throw $exception;
            }

            $this->markGatewayActionUnknown($booking->id, $payment->id, 'cancellation_unknown', $exception);
            throw $exception;
        }
    }

    public function expireBooking(WisataBooking $booking): WisataBooking
    {
        $context = DB::transaction(function () use ($booking) {
            $locked = WisataBooking::query()->whereKey($booking->id)->lockForUpdate()->firstOrFail();

            if ($locked->status !== 'pending_payment') {
                return ['booking' => $locked, 'payment' => null, 'noop' => true];
            }

            if (! $locked->payment_deadline || ! $locked->payment_deadline->isPast()) {
                return ['booking' => $locked, 'payment' => null, 'noop' => true];
            }

            $payment = $locked->payments()->where('provider', 'midtrans')->latest('id')->lockForUpdate()->first();

            if (! $payment) {
                return ['booking' => $locked, 'payment' => null, 'noop' => false];
            }

            $payment->update(['status' => 'expiry_pending']);
            $locked->update(['payment_status' => 'expiry_pending']);

            return ['booking' => $locked, 'payment' => $payment, 'noop' => false];
        }, 3);

        if ($context['noop']) {
            return $context['booking']->fresh();
        }

        if (! $context['payment']) {
            return $this->finalizeExpiry($booking->id);
        }

        /** @var WisataPayment $payment */
        $payment = $context['payment'];

        try {
            $status = $this->midtrans->statusOrNull($payment->order_id);

            if ($status === null) {
                return $this->finalizeExpiry($booking->id, $payment->id, 'expire');
            }

            if ($this->providerPaymentSucceeded($status)) {
                $this->applyProviderPayload($payment, $status);
                return $booking->fresh();
            }

            $transactionStatus = (string) ($status['transaction_status'] ?? '');
            if (in_array($transactionStatus, ['cancel', 'expire', 'deny'], true)) {
                return $this->finalizeExpiry($booking->id, $payment->id, $transactionStatus, $status);
            }

            $response = $this->midtrans->expire($payment->order_id);

            return $this->finalizeExpiry(
                $booking->id,
                $payment->id,
                (string) ($response['transaction_status'] ?? 'expire'),
                $response,
            );
        } catch (Throwable $exception) {
            $this->markGatewayActionUnknown($booking->id, $payment->id, 'expiry_unknown', $exception);
            throw $exception;
        }
    }

    public function requestFullRefund(
        WisataBooking $booking,
        string $reason,
        ?int $requestedAmount,
        int $adminId,
    ): WisataRefund {
        $refund = DB::transaction(function () use ($booking, $reason, $requestedAmount, $adminId) {
            $locked = WisataBooking::query()->whereKey($booking->id)->lockForUpdate()->firstOrFail();

            if (! in_array($locked->status, ['paid', 'completed'], true)) {
                throw new RuntimeException('Refund hanya dapat diproses untuk booking yang sudah dibayar.');
            }

            $payment = $locked->payments()
                ->where('provider', 'midtrans')
                ->whereIn('status', ['settlement', 'capture'])
                ->latest('id')
                ->lockForUpdate()
                ->first();

            if (! $payment) {
                throw new RuntimeException('Transaksi Midtrans yang dapat direfund tidak ditemukan.');
            }

            $existing = WisataRefund::query()
                ->where('wisata_booking_id', $locked->id)
                ->whereIn('status', ['initiating', 'pending', 'processing', 'unknown', 'processed'])
                ->latest('id')
                ->lockForUpdate()
                ->first();

            if ($existing) {
                return $existing;
            }

            $processedAmount = (int) WisataRefund::query()
                ->where('wisata_booking_id', $locked->id)
                ->where('status', 'processed')
                ->sum('amount');
            $refundable = max(0, (int) $payment->gross_amount - $processedAmount);
            $amount = $requestedAmount ?? $refundable;

            if ($amount <= 0 || $amount > $refundable) {
                throw new RuntimeException('Nominal refund tidak valid.');
            }

            if ($amount !== $refundable) {
                throw new RuntimeException('Indotix saat ini hanya mengizinkan full refund atas sisa nominal transaksi.');
            }

            $refund = WisataRefund::query()->create([
                'wisata_booking_id' => $locked->id,
                'wisata_payment_id' => $payment->id,
                'refund_key' => 'WISATA-REFUND-'.$locked->id.'-'.Str::ulid(),
                'amount' => $amount,
                'status' => 'initiating',
                'provider_action' => $payment->status === 'capture' ? 'cancel' : 'refund',
                'created_by_admin_id' => $adminId,
            ]);

            $locked->update([
                'refund_status' => 'pending',
                'refund_reason' => $reason,
            ]);

            return $refund;
        }, 3);

        if ($refund->status === 'processed') {
            return $refund;
        }

        return $this->processRefund($refund, $reason);
    }

    public function processRefund(WisataRefund $refund, ?string $reason = null): WisataRefund
    {
        $refund = $refund->fresh(['payment', 'booking']);
        $payment = $refund->payment;

        if (! $payment || $payment->provider !== 'midtrans') {
            throw new RuntimeException('Provider payment refund tidak valid.');
        }

        try {
            $status = $this->midtrans->statusOrNull($payment->order_id);

            if ($status === null) {
                throw new RuntimeException('Transaksi provider tidak ditemukan.');
            }

            if ($this->providerRefundConfirmed($status, $refund)) {
                return $this->finalizeRefund($refund->id, $status);
            }

            $transactionStatus = (string) ($status['transaction_status'] ?? '');

            if ($refund->provider_action === 'cancel') {
                if (! in_array($transactionStatus, ['capture', 'authorize'], true)) {
                    throw new RuntimeException('Transaksi tidak lagi berada pada status yang dapat dibatalkan.');
                }

                $response = $this->midtrans->cancel($payment->order_id);

                return $this->finalizeRefund($refund->id, $response);
            }

            if ($transactionStatus !== 'settlement') {
                throw new RuntimeException('Refund provider hanya dapat dilakukan pada transaksi settlement.');
            }

            $response = $this->midtrans->refund(
                $payment->order_id,
                $refund->refund_key,
                (int) $refund->amount,
                $reason ?: ($refund->booking?->refund_reason ?: 'Refund booking wisata Indotix'),
            );

            $refund->update([
                'status' => 'processing',
                'provider_refund_id' => (string) ($response['refund_chargeback_id'] ?? $refund->provider_refund_id),
                'provider_payload' => $response,
                'last_error' => null,
            ]);

            if ($this->providerRefundConfirmed($response, $refund)) {
                return $this->finalizeRefund($refund->id, $response);
            }

            return $refund->fresh();
        } catch (PaymentGatewayException $exception) {
            $this->markRefundFailure($refund->id, $exception, ! $exception->isNotFound());
            throw $exception;
        } catch (Throwable $exception) {
            $this->markRefundFailure($refund->id, $exception, false);
            throw $exception;
        }
    }

    public function handleProviderNotification(WisataPayment $payment, array $payload): bool
    {
        $status = (string) ($payload['transaction_status'] ?? '');

        if ($this->providerPaymentSucceeded($payload)) {
            return $this->applyProviderPayload($payment, $payload);
        }

        if (in_array($status, ['refund', 'partial_refund'], true)) {
            $refundKey = (string) ($payload['refund_key'] ?? '');
            $refund = WisataRefund::query()
                ->where('wisata_payment_id', $payment->id)
                ->when($refundKey !== '', fn ($query) => $query->where('refund_key', $refundKey))
                ->latest('id')
                ->first();

            if ($refund && $this->providerRefundConfirmed($payload, $refund)) {
                $this->finalizeRefund($refund->id, $payload);
            }

            $this->updatePaymentFromProvider($payment->id, $payload, true);

            return false;
        }

        if (in_array($status, ['cancel', 'expire', 'deny'], true)) {
            DB::transaction(function () use ($payment, $payload, $status) {
                $lockedPayment = WisataPayment::query()->whereKey($payment->id)->lockForUpdate()->firstOrFail();
                $booking = WisataBooking::query()->whereKey($lockedPayment->wisata_booking_id)->lockForUpdate()->firstOrFail();

                $lockedPayment->update([
                    'status' => $status,
                    'payment_type' => $payload['payment_type'] ?? $lockedPayment->payment_type,
                    'transaction_id' => $payload['transaction_id'] ?? $lockedPayment->transaction_id,
                    'payload' => $payload,
                    'active_key' => null,
                    'last_gateway_error' => null,
                    'last_reconciled_at' => now(),
                ]);

                if ($booking->status === 'pending_payment') {
                    $booking->update([
                        'status' => 'expired',
                        'payment_status' => $status,
                    ]);
                }

                WisataAffiliateCommissionItem::query()
                    ->where('wisata_booking_id', $booking->id)
                    ->where('status', '!=', 'cancelled')
                    ->update([
                        'status' => 'cancelled',
                        'reason' => 'Pembayaran tidak berhasil atau kedaluwarsa.',
                    ]);
            }, 3);

            return false;
        }

        $this->updatePaymentFromProvider($payment->id, $payload, false);

        return false;
    }

    public function reconcile(WisataPayment $payment): void
    {
        $payment = $payment->fresh();

        try {
            $status = $this->midtrans->statusOrNull($payment->order_id);

            if ($status === null) {
                if (in_array($payment->status, ['initiating', 'unknown'], true)) {
                    DB::transaction(function () use ($payment) {
                        $locked = WisataPayment::query()->whereKey($payment->id)->lockForUpdate()->firstOrFail();
                        $booking = WisataBooking::query()->whereKey($locked->wisata_booking_id)->lockForUpdate()->firstOrFail();
                        $locked->update([
                            'status' => 'failed',
                            'active_key' => null,
                            'last_reconciled_at' => now(),
                            'reconciliation_attempts' => (int) $locked->reconciliation_attempts + 1,
                        ]);
                        if ($booking->status === 'pending_payment') {
                            $booking->update(['payment_status' => 'pending']);
                        }
                    }, 3);
                }

                return;
            }

            $this->handleProviderNotification($payment, $status);
        } catch (Throwable $exception) {
            WisataPayment::query()->whereKey($payment->id)->update([
                'last_gateway_error' => $this->safeError($exception),
                'last_reconciled_at' => now(),
                'reconciliation_attempts' => DB::raw('reconciliation_attempts + 1'),
            ]);

            throw $exception;
        }
    }

    public function expireDueBookings(int $limit = 100): int
    {
        $bookings = WisataBooking::query()
            ->where('status', 'pending_payment')
            ->whereNotNull('payment_deadline')
            ->where('payment_deadline', '<=', now())
            ->orderBy('id')
            ->limit($limit)
            ->get();

        $processed = 0;
        foreach ($bookings as $booking) {
            try {
                $this->expireBooking($booking);
                $processed++;
            } catch (Throwable $exception) {
                Log::warning('Wisata booking expiry reconciliation failed', [
                    'booking_id' => $booking->id,
                    'error' => $this->safeError($exception),
                ]);
            }
        }

        return $processed;
    }

    public function reconcileRecentPayments(int $limit = 50): int
    {
        $payments = WisataPayment::query()
            ->where('provider', 'midtrans')
            ->where(function ($query) {
                $query->whereIn('status', self::ACTIVE_PAYMENT_STATUSES)
                    ->orWhere(function ($paid) {
                        $paid->whereIn('status', ['settlement', 'capture'])
                            ->whereNull('notification_dispatched_at');
                    });
            })
            ->where('created_at', '>=', now()->subDays(7))
            ->orderBy('id')
            ->limit($limit)
            ->get();

        $processed = 0;
        foreach ($payments as $payment) {
            try {
                if (in_array($payment->status, ['settlement', 'capture'], true) && ! $payment->notification_dispatched_at) {
                    $this->dispatchPaidSideEffects($payment->fresh(['booking']));
                } else {
                    $this->reconcile($payment);
                }
                $processed++;
            } catch (Throwable $exception) {
                Log::warning('Wisata payment reconciliation failed', [
                    'payment_id' => $payment->id,
                    'order_id' => $payment->order_id,
                    'error' => $this->safeError($exception),
                ]);
            }
        }

        $refunds = WisataRefund::query()
            ->whereIn('status', ['pending', 'processing', 'unknown'])
            ->where('created_at', '>=', now()->subDays(30))
            ->orderBy('id')
            ->limit($limit)
            ->get();

        foreach ($refunds as $refund) {
            try {
                $this->processRefund($refund);
                $processed++;
            } catch (Throwable $exception) {
                Log::warning('Wisata refund reconciliation failed', [
                    'refund_id' => $refund->id,
                    'refund_key' => $refund->refund_key,
                    'error' => $this->safeError($exception),
                ]);
            }
        }

        return $processed;
    }

    private function buildSnapPayload(WisataBooking $booking, string $orderId): array
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
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => (int) $booking->total_price,
            ],
            'item_details' => $items,
            'customer_details' => [
                'first_name' => $booking->guest_name,
                'email' => $booking->guest_email,
                'phone' => $booking->guest_phone,
            ],
            'expiry' => [
                'duration' => $duration,
                'unit' => 'minute',
            ],
        ];
    }

    private function applyProviderPayload(WisataPayment $payment, array $payload): bool
    {
        $transitioned = DB::transaction(function () use ($payment, $payload) {
            $lockedPayment = WisataPayment::query()->whereKey($payment->id)->lockForUpdate()->firstOrFail();
            $booking = WisataBooking::query()->whereKey($lockedPayment->wisata_booking_id)->lockForUpdate()->firstOrFail();
            $providerStatus = (string) ($payload['transaction_status'] ?? $lockedPayment->status);

            $lockedPayment->update([
                'status' => $providerStatus,
                'payment_type' => $payload['payment_type'] ?? $lockedPayment->payment_type,
                'transaction_id' => $payload['transaction_id'] ?? $lockedPayment->transaction_id,
                'payload' => $payload,
                'active_key' => null,
                'last_gateway_error' => null,
                'last_reconciled_at' => now(),
                'reconciliation_attempts' => (int) $lockedPayment->reconciliation_attempts + 1,
            ]);

            if (in_array($booking->status, ['cancelled', 'expired'], true)) {
                $booking->update(['refund_status' => 'pending']);

                WisataRefund::query()->firstOrCreate(
                    ['refund_key' => 'WISATA-LATE-'.$lockedPayment->id],
                    [
                        'wisata_booking_id' => $booking->id,
                        'wisata_payment_id' => $lockedPayment->id,
                        'amount' => (int) $lockedPayment->gross_amount,
                        'status' => 'pending',
                        'provider_action' => $providerStatus === 'capture' ? 'cancel' : 'refund',
                    ],
                );

                Log::critical('Successful Midtrans payment arrived for terminal wisata booking; compensation queued.', [
                    'booking_id' => $booking->id,
                    'payment_id' => $lockedPayment->id,
                    'order_id' => $lockedPayment->order_id,
                    'booking_status' => $booking->status,
                    'provider_status' => $providerStatus,
                ]);

                return false;
            }

            if ($booking->status === 'paid' || $booking->status === 'completed') {
                return false;
            }

            if ($booking->status !== 'pending_payment') {
                throw new RuntimeException('Invalid booking state transition to paid.');
            }

            $booking->update([
                'status' => 'paid',
                'payment_status' => $providerStatus,
                'payment_deadline' => null,
            ]);

            WisataAffiliateCommissionItem::query()
                ->where('wisata_booking_id', $booking->id)
                ->where('status', 'pending')
                ->update([
                    'status' => 'approved',
                    'reason' => null,
                ]);

            return true;
        }, 3);

        if ($transitioned) {
            $this->dispatchPaidSideEffects($payment->fresh(['booking']));
        }

        return $transitioned;
    }

    private function dispatchPaidSideEffects(WisataPayment $payment): void
    {
        $payment = $payment->fresh(['booking']);
        $booking = $payment->booking;

        if (! $booking || $payment->notification_dispatched_at) {
            return;
        }

        $encryptedId = Crypt::encryptString((string) $booking->id);
        $alreadyNotified = UserNotification::query()
            ->where('user_id', $booking->user_id)
            ->where('type', 'wisata_payment_paid')
            ->where('data->booking_db_id', $booking->id)
            ->exists();

        if (! $alreadyNotified) {
            UserNotification::query()->create([
                'user_id' => $booking->user_id,
                'title' => 'Pembayaran tiket berhasil',
                'message' => 'Pembayaran kamu sudah diterima. Tiket wisata aktif.',
                'type' => 'wisata_payment_paid',
                'data' => [
                    'booking_id' => $encryptedId,
                    'booking_db_id' => $booking->id,
                    'type' => 'wisata',
                    'category' => 'wisata',
                ],
            ]);
        }

        SendPushNotificationJob::dispatch(
            $booking->user_id,
            'Pembayaran tiket berhasil',
            'Pembayaran kamu sudah diterima. Tiket wisata aktif.',
            [
                'booking_id' => $encryptedId,
                'type' => 'wisata',
                'category' => 'wisata',
                'notification_type' => 'wisata_payment_paid',
            ],
            ['booking_id' => $booking->id, 'payment_id' => $payment->id],
        );

        if ($booking->guest_email) {
            try {
                Mail::to($booking->guest_email)->send(new WisataTicketMail($booking));
            } catch (Throwable $exception) {
                Log::warning('Failed to send wisata ticket email', [
                    'booking_id' => $booking->id,
                    'payment_id' => $payment->id,
                    'error' => $this->safeError($exception),
                ]);

                return;
            }
        }

        $payment->update(['notification_dispatched_at' => now()]);
    }

    private function finalizeCancellation(
        int $bookingId,
        ?string $reason,
        ?int $adminId,
        ?int $paymentId = null,
        string $providerStatus = 'cancel',
        array $payload = [],
    ): WisataBooking {
        return DB::transaction(function () use ($bookingId, $reason, $adminId, $paymentId, $providerStatus, $payload) {
            $booking = WisataBooking::query()->whereKey($bookingId)->lockForUpdate()->firstOrFail();

            if ($booking->status === 'paid' || $booking->status === 'completed') {
                throw new RuntimeException('Booking yang sudah dibayar tidak dapat dibatalkan.');
            }

            if ($paymentId) {
                WisataPayment::query()->whereKey($paymentId)->lockForUpdate()->update([
                    'status' => $providerStatus,
                    'payload' => $payload ?: DB::raw('payload'),
                    'active_key' => null,
                    'last_gateway_error' => null,
                    'last_reconciled_at' => now(),
                ]);
            }

            $booking->update([
                'status' => 'cancelled',
                'payment_status' => $providerStatus,
                'cancel_reason' => $reason,
                'cancelled_at' => now(),
                'cancelled_by_admin_id' => $adminId,
            ]);

            WisataAffiliateCommissionItem::query()
                ->where('wisata_booking_id', $booking->id)
                ->where('status', '!=', 'cancelled')
                ->update([
                    'status' => 'cancelled',
                    'reason' => 'Booking dibatalkan sebelum pembayaran selesai.',
                ]);

            return $booking->fresh();
        }, 3);
    }

    private function finalizeExpiry(
        int $bookingId,
        ?int $paymentId = null,
        string $providerStatus = 'expire',
        array $payload = [],
    ): WisataBooking {
        return DB::transaction(function () use ($bookingId, $paymentId, $providerStatus, $payload) {
            $booking = WisataBooking::query()->whereKey($bookingId)->lockForUpdate()->firstOrFail();

            if ($booking->status !== 'pending_payment') {
                return $booking;
            }

            if ($paymentId) {
                WisataPayment::query()->whereKey($paymentId)->lockForUpdate()->update([
                    'status' => $providerStatus,
                    'payload' => $payload ?: DB::raw('payload'),
                    'active_key' => null,
                    'last_gateway_error' => null,
                    'last_reconciled_at' => now(),
                ]);
            }

            $booking->update([
                'status' => 'expired',
                'payment_status' => $providerStatus,
            ]);

            WisataAffiliateCommissionItem::query()
                ->where('wisata_booking_id', $booking->id)
                ->where('status', '!=', 'cancelled')
                ->update([
                    'status' => 'cancelled',
                    'reason' => 'Booking kedaluwarsa sebelum pembayaran selesai.',
                ]);

            return $booking->fresh();
        }, 3);
    }

    private function finalizeRefund(int $refundId, array $providerPayload): WisataRefund
    {
        $result = DB::transaction(function () use ($refundId, $providerPayload) {
            $refund = WisataRefund::query()->whereKey($refundId)->lockForUpdate()->firstOrFail();

            if ($refund->status === 'processed') {
                return ['refund' => $refund, 'newly_processed' => false];
            }

            $booking = WisataBooking::query()->whereKey($refund->wisata_booking_id)->lockForUpdate()->firstOrFail();
            $payment = WisataPayment::query()->whereKey($refund->wisata_payment_id)->lockForUpdate()->firstOrFail();

            $refund->update([
                'status' => 'processed',
                'provider_refund_id' => (string) (
                    $providerPayload['refund_chargeback_id']
                    ?? $providerPayload['refund_id']
                    ?? $refund->provider_refund_id
                    ?? ''
                ) ?: null,
                'provider_payload' => $providerPayload,
                'last_error' => null,
                'processed_at' => now(),
            ]);

            $processedAmount = (int) WisataRefund::query()
                ->where('wisata_booking_id', $booking->id)
                ->where('status', 'processed')
                ->sum('amount');

            $booking->update([
                'refund_status' => 'processed',
                'refund_amount' => $processedAmount,
                'refund_processed_at' => now(),
            ]);

            WisataAffiliateCommissionItem::query()
                ->where('wisata_booking_id', $booking->id)
                ->where('status', '!=', 'cancelled')
                ->update([
                    'status' => 'cancelled',
                    'reason' => 'Komisi dibalik karena booking direfund.',
                ]);

            return ['refund' => $refund->fresh(), 'newly_processed' => true, 'booking' => $booking->fresh()];
        }, 3);

        if ($result['newly_processed']) {
            $this->finance->recordRefundImpact($result['booking'], $result['refund']);
        }

        return $result['refund']->fresh();
    }

    private function markRefundFailure(int $refundId, Throwable $exception, bool $definitive): void
    {
        DB::transaction(function () use ($refundId, $exception, $definitive) {
            $refund = WisataRefund::query()->whereKey($refundId)->lockForUpdate()->first();
            if (! $refund || $refund->status === 'processed') {
                return;
            }

            $refund->update([
                'status' => $definitive ? 'failed' : 'unknown',
                'last_error' => $this->safeError($exception),
            ]);

            $refund->booking()->update([
                'refund_status' => $definitive ? 'rejected' : 'pending',
            ]);
        }, 3);
    }

    private function markGatewayActionUnknown(
        int $bookingId,
        int $paymentId,
        string $status,
        Throwable $exception,
    ): void {
        DB::transaction(function () use ($bookingId, $paymentId, $status, $exception) {
            WisataPayment::query()->whereKey($paymentId)->lockForUpdate()->update([
                'status' => $status,
                'last_gateway_error' => $this->safeError($exception),
            ]);
            WisataBooking::query()->whereKey($bookingId)->lockForUpdate()->update([
                'payment_status' => $status,
            ]);
        }, 3);
    }

    private function updatePaymentFromProvider(int $paymentId, array $payload, bool $terminal): void
    {
        WisataPayment::query()->whereKey($paymentId)->update([
            'status' => (string) ($payload['transaction_status'] ?? 'unknown'),
            'payment_type' => $payload['payment_type'] ?? DB::raw('payment_type'),
            'transaction_id' => $payload['transaction_id'] ?? DB::raw('transaction_id'),
            'payload' => $payload,
            'active_key' => $terminal ? null : DB::raw('active_key'),
            'last_gateway_error' => null,
            'last_reconciled_at' => now(),
            'reconciliation_attempts' => DB::raw('reconciliation_attempts + 1'),
        ]);
    }

    private function providerPaymentSucceeded(array $payload): bool
    {
        $status = (string) ($payload['transaction_status'] ?? '');
        $statusCode = (string) ($payload['status_code'] ?? '200');

        if ($statusCode !== '200') {
            return false;
        }

        if ($status === 'settlement') {
            return true;
        }

        return $status === 'capture'
            && (! array_key_exists('fraud_status', $payload) || $payload['fraud_status'] === 'accept');
    }

    private function providerRefundConfirmed(array $payload, WisataRefund $refund): bool
    {
        if ($refund->provider_action === 'cancel') {
            return in_array((string) ($payload['transaction_status'] ?? ''), ['cancel', 'expire', 'deny'], true)
                && in_array((string) ($payload['status_code'] ?? '200'), ['200', '201', '202', '407'], true);
        }

        $status = (string) ($payload['transaction_status'] ?? '');
        if (! in_array($status, ['refund', 'partial_refund'], true)) {
            return false;
        }

        $refundAmount = (int) round((float) (
            $payload['refund_amount']
            ?? data_get($payload, 'refunds.0.refund_amount')
            ?? 0
        ));

        $bankConfirmed = ! empty($payload['bank_confirmed_at'])
            || ! empty(data_get($payload, 'refunds.0.bank_confirmed_at'));

        return $bankConfirmed && ($refundAmount === 0 || $refundAmount >= (int) $refund->amount);
    }

    private function activeKey(WisataBooking $booking): string
    {
        return 'wisata-booking-'.$booking->id;
    }

    private function safeError(Throwable $exception): string
    {
        return mb_substr($exception->getMessage(), 0, 500);
    }
}
