<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Payment;
use App\Models\UserNotification;
use App\Models\EventBooking;
use App\Models\EventPayment;
use App\Models\AcademyBooking;
use App\Models\AcademyPayment;
use App\Models\WisataBooking;
use App\Models\WisataPayment;
use App\Models\SpecialProgramBooking;
use App\Models\SpecialProgramPayment;
use App\Models\WisataAffiliateCommissionItem;
use App\Models\SouvenirOrder;
use App\Services\BookingService;
use App\Services\MidtransService;
use App\Services\WisataPaymentLifecycleService;
use App\Services\PushNotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class MidtransCallbackController extends Controller
{
    public function __invoke(Request $request, MidtransService $midtransService, WisataPaymentLifecycleService $wisataPayments): Response
    {
        $payload = $request->all();

        $orderId = (string) ($payload['order_id'] ?? '');
        $statusCode = (string) ($payload['status_code'] ?? '');
        $grossAmount = (string) ($payload['gross_amount'] ?? '');
        $signature = (string) ($payload['signature_key'] ?? '');

        if (! $orderId || ! $midtransService->validateSignature($orderId, $statusCode, $grossAmount, $signature)) {
            return response('Invalid signature', 400);
        }

        // Dashboard delivery probes are signed notifications without a customer booking.
        $merchantId = (string) ($payload['merchant_id'] ?? '');
        if ($merchantId !== '' && preg_match(
            '/\Apayment_notif_test_'.preg_quote($merchantId, '/').'_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\z/i',
            $orderId
        ) === 1) {
            return response('OK', 200);
        }

        $callbackLock = Cache::lock('midtrans:callback:'.hash('sha256', $orderId), 30);
        if (! $callbackLock->get()) {
            return response('Callback already processing', 409);
        }

        try {
        $payment = Payment::query()->where('order_id', $orderId)->latest()->first();
        $booking = $payment?->booking ?? Booking::query()->where('midtrans_order_id', $orderId)->first();

        $wisataPayment = null;
        $wisataBooking = null;
        $eventPayment = null;
        $eventBooking = null;
        $academyPayment = null;
        $academyBooking = null;
        $specialPayment = null;
        $specialBooking = null;
        $souvenirOrder = null;
        if (! $booking) {
            $wisataPayment = WisataPayment::query()->where('order_id', $orderId)->latest()->first();
            $wisataBooking = $wisataPayment?->booking ?? WisataBooking::query()->where('midtrans_order_id', $orderId)->first();
        }
        if (! $booking && ! $wisataBooking) {
            $eventPayment = EventPayment::query()->where('order_id', $orderId)->latest()->first();
            $eventBooking = $eventPayment?->booking ?? EventBooking::query()->where('midtrans_order_id', $orderId)->first();
        }
        if (! $booking && ! $wisataBooking && ! $eventBooking) {
            $academyPayment = AcademyPayment::query()->where('order_id', $orderId)->latest()->first();
            $academyBooking = $academyPayment?->booking ?? AcademyBooking::query()->where('midtrans_order_id', $orderId)->first();
        }
        if (! $booking && ! $wisataBooking && ! $eventBooking && ! $academyBooking) {
            $specialPayment = SpecialProgramPayment::query()->where('order_id', $orderId)->latest()->first();
            $specialBooking = $specialPayment?->booking ?? SpecialProgramBooking::query()->where('midtrans_order_id', $orderId)->first();
        }
        if (! $booking && ! $wisataBooking && ! $eventBooking && ! $academyBooking && ! $specialBooking) {
            $souvenirOrder = SouvenirOrder::query()->where('midtrans_order_id', $orderId)->first();
        }

        if (! $booking && ! $wisataBooking && ! $eventBooking && ! $academyBooking && ! $specialBooking && ! $souvenirOrder) {
            return response('Booking not found', 404);
        }

        $status = $payload['transaction_status'] ?? null;
        $isSuccessful = $statusCode === '200' && (
            $status === 'settlement'
            || (
                $status === 'capture'
                && (! array_key_exists('fraud_status', $payload) || $payload['fraud_status'] === 'accept')
            )
        );

        if (! $this->callbackAmountMatches(
            $grossAmount,
            $payment,
            $booking,
            $wisataPayment,
            $wisataBooking,
            $eventPayment,
            $eventBooking,
            $academyPayment,
            $academyBooking,
            $specialPayment,
            $specialBooking,
            $souvenirOrder
        )) {
            Log::warning('Midtrans callback gross amount mismatch', [
                'order_id' => $orderId,
                'status' => $status,
            ]);

            return response('Amount mismatch', 422);
        }

        if ($wisataPayment && $wisataBooking) {
            $wisataPayments->handleProviderNotification($wisataPayment, $payload);

            return response('OK', 200);
        }

        if (
            ! $isSuccessful
            && $this->bookingAlreadyPaid($booking, $wisataBooking, $eventBooking, $academyBooking, $specialBooking, $souvenirOrder)
        ) {
            Log::info('Ignoring non-success Midtrans callback for paid booking', [
                'order_id' => $orderId,
                'status' => $status,
            ]);

            return response('OK', 200);
        }

        if ($payment) {
            $payment->update([
                'status' => $status ?? $payment->status,
                'payment_type' => $payload['payment_type'] ?? $payment->payment_type,
                'transaction_id' => $payload['transaction_id'] ?? $payment->transaction_id,
                'payload' => $payload,
            ]);
        }

        if ($wisataPayment) {
            $wisataPayment->update([
                'status' => $status ?? $wisataPayment->status,
                'payment_type' => $payload['payment_type'] ?? $wisataPayment->payment_type,
                'transaction_id' => $payload['transaction_id'] ?? $wisataPayment->transaction_id,
                'payload' => $payload,
            ]);
        }
        if ($eventPayment) {
            $eventPayment->update([
                'status' => $status ?? $eventPayment->status,
                'payment_type' => $payload['payment_type'] ?? $eventPayment->payment_type,
                'transaction_id' => $payload['transaction_id'] ?? $eventPayment->transaction_id,
                'payload' => $payload,
            ]);
        }
        if ($academyPayment) {
            $academyPayment->update([
                'status' => $status ?? $academyPayment->status,
                'payment_type' => $payload['payment_type'] ?? $academyPayment->payment_type,
                'transaction_id' => $payload['transaction_id'] ?? $academyPayment->transaction_id,
                'payload' => $payload,
            ]);
        }
        if ($specialPayment) {
            $specialPayment->update([
                'status' => $status ?? $specialPayment->status,
                'payment_type' => $payload['payment_type'] ?? $specialPayment->payment_type,
                'transaction_id' => $payload['transaction_id'] ?? $specialPayment->transaction_id,
                'payload' => $payload,
            ]);
        }

        if ($souvenirOrder) {
            $souvenirOrder->update([
                'payment_status' => $status ?? $souvenirOrder->payment_status,
                'payment_type' => $payload['payment_type'] ?? $souvenirOrder->payment_type,
                'transaction_id' => $payload['transaction_id'] ?? $souvenirOrder->transaction_id,
                'payment_payload' => $payload,
            ]);
        }

        if ($isSuccessful && $this->bookingCannotTransitionToPaid(
            $booking,
            $wisataBooking,
            $eventBooking,
            $academyBooking,
            $specialBooking,
            $souvenirOrder
        )) {
            Log::critical('Midtrans reported a successful payment for a terminal booking', [
                'order_id' => $orderId,
                'status' => $status,
            ]);

            return response('OK', 200);
        }

        if ($booking && $isSuccessful) {
            $wasPaid = $booking->status === 'paid';
            $booking->update([
                'status' => 'paid',
                'payment_status' => $status,
            ]);

            if (! $wasPaid) {
                $encryptedId = \Illuminate\Support\Facades\Crypt::encryptString((string) $booking->id);
                UserNotification::create([
                    'user_id' => $booking->user_id,
                    'title' => 'Pembayaran berhasil',
                    'message' => 'Pembayaran kamu sudah diterima. Booking sudah aktif.',
                    'type' => 'payment_paid',
                    'data' => [
                        'booking_id' => $encryptedId,
                        'category' => 'hotel',
                    ],
                ]);

                $this->sendPaymentPush(
                    $booking->user_id,
                    'Pembayaran berhasil',
                    'Pembayaran kamu sudah diterima. Booking sudah aktif.',
                    [
                        'booking_id' => $encryptedId,
                        'type' => 'hotel',
                        'category' => 'hotel',
                        'notification_type' => 'payment_paid',
                    ]
                );
            }
        }

        if ($wisataBooking && $isSuccessful) {
            $wasPaid = $wisataBooking->status === 'paid';
            $wisataBooking->update([
                'status' => 'paid',
                'payment_status' => $status,
            ]);

            if (! $wasPaid) {
                $encryptedId = \Illuminate\Support\Facades\Crypt::encryptString((string) $wisataBooking->id);
                UserNotification::create([
                    'user_id' => $wisataBooking->user_id,
                    'title' => 'Pembayaran tiket berhasil',
                    'message' => 'Pembayaran kamu sudah diterima. Tiket wisata aktif.',
                    'type' => 'wisata_payment_paid',
                    'data' => [
                        'booking_id' => $encryptedId,
                        'type' => 'wisata',
                        'category' => 'wisata',
                    ],
                ]);

                $this->sendPaymentPush(
                    $wisataBooking->user_id,
                    'Pembayaran tiket berhasil',
                    'Pembayaran kamu sudah diterima. Tiket wisata aktif.',
                    [
                        'booking_id' => $encryptedId,
                        'type' => 'wisata',
                        'category' => 'wisata',
                        'notification_type' => 'wisata_payment_paid',
                    ]
                );

                if ($wisataBooking->guest_email) {
                    try {
                        \Illuminate\Support\Facades\Mail::to($wisataBooking->guest_email)
                            ->send(new \App\Mail\WisataTicketMail($wisataBooking));
                    } catch (\Throwable $exception) {
                        \Illuminate\Support\Facades\Log::warning('Failed to send wisata ticket email', [
                            'booking_id' => $wisataBooking->id,
                            'message' => $exception->getMessage(),
                        ]);
                    }
                }
            }

            $commissionItems = WisataAffiliateCommissionItem::query()
                ->where('wisata_booking_id', $wisataBooking->id)
                ->get();

            foreach ($commissionItems as $item) {
                if ($item->status !== 'approved') {
                    $item->update(['status' => 'approved']);
                    if ($item->affiliate?->user_id) {
                        UserNotification::create([
                            'user_id' => $item->affiliate->user_id,
                            'title' => 'Komisi disetujui',
                            'message' => 'Komisi afiliasi kamu sudah disetujui setelah pembayaran berhasil.',
                            'type' => 'affiliate_commission_approved',
                            'data' => [
                                'booking_id' => \Illuminate\Support\Facades\Crypt::encryptString((string) $wisataBooking->id),
                                'category' => 'affiliate',
                            ],
                        ]);
                    }
                }
            }
        }

        if ($eventBooking && $isSuccessful) {
            $eventBooking->loadMissing('event', 'ticket');
            $wasPaid = $eventBooking->status === 'paid';
            $eventBooking->update([
                'status' => 'paid',
                'payment_status' => $status,
            ]);
            if (! $wasPaid) {
                $eventBooking->ticket?->increment('sold_count', $eventBooking->quantity);
                $eventBooking->event?->increment('capacity_sold', $eventBooking->quantity);

                $encryptedId = \Illuminate\Support\Facades\Crypt::encryptString((string) $eventBooking->id);
                $isSpecial = $eventBooking->event?->event_type === 'special_program';
                $notificationType = $isSpecial ? 'special_program_payment_paid' : 'event_payment_paid';
                $notificationTitle = $isSpecial
                    ? 'Pembayaran special program berhasil'
                    : 'Pembayaran event berhasil';
                $notificationMessage = $isSpecial
                    ? 'Pembayaran kamu sudah diterima. Pesanan special program aktif.'
                    : 'Pembayaran kamu sudah diterima. Tiket event aktif.';
                $category = $isSpecial ? 'special_program' : 'event';
                UserNotification::create([
                    'user_id' => $eventBooking->user_id,
                    'title' => $notificationTitle,
                    'message' => $notificationMessage,
                    'type' => $notificationType,
                    'data' => [
                        'booking_id' => $encryptedId,
                        'type' => $category,
                        'category' => $category,
                    ],
                ]);

                $this->sendPaymentPush(
                    $eventBooking->user_id,
                    $notificationTitle,
                    $notificationMessage,
                    [
                        'booking_id' => $encryptedId,
                        'type' => $category,
                        'category' => $category,
                        'notification_type' => $notificationType,
                    ]
                );
            }
        }

        if ($academyBooking && $isSuccessful) {
            $wasPaid = $academyBooking->status === 'paid';
            $academyBooking->update([
                'status' => 'paid',
                'payment_status' => $status,
            ]);
            if (! $wasPaid) {
                $academyBooking->ticket?->increment('sold_count', $academyBooking->quantity);
                $academyBooking->academyClass?->increment('capacity_sold', $academyBooking->quantity);

                $encryptedId = \Illuminate\Support\Facades\Crypt::encryptString((string) $academyBooking->id);
                UserNotification::create([
                    'user_id' => $academyBooking->user_id,
                    'title' => 'Pembayaran kelas berhasil',
                    'message' => 'Pembayaran kamu sudah diterima. Tiket kelas aktif.',
                    'type' => 'academy_payment_paid',
                    'data' => [
                        'booking_id' => $encryptedId,
                        'type' => 'academy',
                        'category' => 'academy',
                    ],
                ]);

                $this->sendPaymentPush(
                    $academyBooking->user_id,
                    'Pembayaran kelas berhasil',
                    'Pembayaran kamu sudah diterima. Tiket kelas aktif.',
                    [
                        'booking_id' => $encryptedId,
                        'type' => 'academy',
                        'category' => 'academy',
                        'notification_type' => 'academy_payment_paid',
                    ]
                );
            }
        }

        if ($specialBooking && $isSuccessful) {
            $wasPaid = $specialBooking->status === 'paid';
            $specialBooking->update([
                'status' => 'paid',
                'payment_status' => $status,
            ]);

            if (! $wasPaid) {
                $encryptedId = \Illuminate\Support\Facades\Crypt::encryptString((string) $specialBooking->id);
                UserNotification::create([
                    'user_id' => $specialBooking->user_id,
                    'title' => 'Pembayaran special program berhasil',
                    'message' => 'Pembayaran kamu sudah diterima. Pesanan special program aktif.',
                    'type' => 'special_program_payment_paid',
                    'data' => [
                        'booking_id' => $encryptedId,
                        'type' => 'special_program',
                        'category' => 'special_program',
                    ],
                ]);

                $this->sendPaymentPush(
                    $specialBooking->user_id,
                    'Pembayaran special program berhasil',
                    'Pembayaran kamu sudah diterima. Pesanan special program aktif.',
                    [
                        'booking_id' => $encryptedId,
                        'type' => 'special_program',
                        'category' => 'special_program',
                        'notification_type' => 'special_program_payment_paid',
                    ]
                );
            }
        }

        if ($souvenirOrder && $isSuccessful) {
            $wasPaid = $souvenirOrder->status === 'paid';
            $souvenirOrder->update([
                'status' => 'paid',
                'payment_status' => $status,
            ]);

            if (! $wasPaid) {
                $encryptedId = \Illuminate\Support\Facades\Crypt::encryptString((string) $souvenirOrder->id);
                UserNotification::create([
                    'user_id' => $souvenirOrder->user_id,
                    'title' => 'Pembayaran souvenir berhasil',
                    'message' => 'Pembayaran kamu sudah diterima. Pesanan souvenir diproses.',
                    'type' => 'souvenir_payment_paid',
                    'data' => [
                        'booking_id' => $encryptedId,
                        'category' => 'souvenir',
                    ],
                ]);

                $this->sendPaymentPush(
                    $souvenirOrder->user_id,
                    'Pembayaran souvenir berhasil',
                    'Pembayaran kamu sudah diterima. Pesanan souvenir diproses.',
                    [
                        'booking_id' => $encryptedId,
                        'type' => 'souvenir',
                        'category' => 'souvenir',
                        'notification_type' => 'souvenir_payment_paid',
                    ]
                );
            }
        }

        if ($booking && in_array($status, ['cancel', 'expire', 'deny'], true)) {
            if ($booking->status === 'pending_payment') {
                $room = $booking->rooms()->first();
                if ($room && $room->roomType) {
                    app(BookingService::class)->releaseInventory(
                        $room->roomType,
                        $booking->check_in->toDateString(),
                        $booking->check_out->toDateString(),
                        $room->rooms_count
                    );
                }
            }

            $booking->update([
                'status' => 'expired',
                'payment_status' => $status,
            ]);

            UserNotification::create([
                'user_id' => $booking->user_id,
                'title' => 'Pembayaran gagal',
                'message' => 'Pembayaran tidak berhasil atau kedaluwarsa. Silakan buat pesanan baru.',
                'type' => 'booking_expired',
                'data' => [
                    'booking_id' => \Illuminate\Support\Facades\Crypt::encryptString((string) $booking->id),
                    'category' => 'hotel',
                ],
            ]);
        }

        if ($wisataBooking && in_array($status, ['cancel', 'expire', 'deny'], true)) {
            if ($wisataBooking->status === 'pending_payment') {
                $wisataBooking->update([
                    'status' => 'expired',
                    'payment_status' => $status,
                ]);
            }

            UserNotification::create([
                'user_id' => $wisataBooking->user_id,
                'title' => 'Pembayaran tiket gagal',
                'message' => 'Pembayaran tiket wisata tidak berhasil atau kedaluwarsa.',
                'type' => 'wisata_booking_expired',
                'data' => [
                    'booking_id' => \Illuminate\Support\Facades\Crypt::encryptString((string) $wisataBooking->id),
                    'type' => 'wisata',
                    'category' => 'wisata',
                ],
            ]);

            $commissionItems = WisataAffiliateCommissionItem::query()
                ->where('wisata_booking_id', $wisataBooking->id)
                ->get();

            foreach ($commissionItems as $item) {
                if ($item->status !== 'cancelled') {
                    $item->update([
                        'status' => 'cancelled',
                        'reason' => 'Pembayaran tidak berhasil atau kedaluwarsa.',
                    ]);
                    if ($item->affiliate?->user_id) {
                        UserNotification::create([
                            'user_id' => $item->affiliate->user_id,
                            'title' => 'Komisi dibatalkan',
                            'message' => 'Komisi afiliasi dibatalkan karena pembayaran tidak berhasil.',
                            'type' => 'affiliate_commission_cancelled',
                            'data' => [
                                'booking_id' => \Illuminate\Support\Facades\Crypt::encryptString((string) $wisataBooking->id),
                                'category' => 'affiliate',
                            ],
                        ]);
                    }
                }
            }
        }

        if ($academyBooking && in_array($status, ['cancel', 'expire', 'deny'], true)) {
            if ($academyBooking->status === 'pending_payment') {
                $academyBooking->update([
                    'status' => 'expired',
                    'payment_status' => $status,
                ]);
            }

            UserNotification::create([
                'user_id' => $academyBooking->user_id,
                'title' => 'Pembayaran kelas gagal',
                'message' => 'Pembayaran tidak berhasil atau kedaluwarsa. Silakan buat pesanan baru.',
                'type' => 'academy_booking_expired',
                'data' => [
                    'booking_id' => \Illuminate\Support\Facades\Crypt::encryptString((string) $academyBooking->id),
                    'type' => 'academy',
                    'category' => 'academy',
                ],
            ]);
        }

        if ($eventBooking && in_array($status, ['cancel', 'expire', 'deny'], true)) {
            if ($eventBooking->status === 'pending_payment') {
                $eventBooking->update([
                    'status' => 'expired',
                    'payment_status' => $status,
                ]);
            }
            $eventBooking->loadMissing('event');
            $isSpecial = $eventBooking->event?->event_type === 'special_program';
            $notificationType = $isSpecial ? 'special_program_booking_expired' : 'event_booking_expired';
            $notificationTitle = $isSpecial
                ? 'Pembayaran special program gagal'
                : 'Pembayaran event gagal';
            $notificationMessage = $isSpecial
                ? 'Pembayaran special program tidak berhasil atau kedaluwarsa.'
                : 'Pembayaran event tidak berhasil atau kedaluwarsa.';
            $category = $isSpecial ? 'special_program' : 'event';
            UserNotification::create([
                'user_id' => $eventBooking->user_id,
                'title' => $notificationTitle,
                'message' => $notificationMessage,
                'type' => $notificationType,
                'data' => [
                    'booking_id' => \Illuminate\Support\Facades\Crypt::encryptString((string) $eventBooking->id),
                    'type' => $category,
                    'category' => $category,
                ],
            ]);
        }

        if ($specialBooking && in_array($status, ['cancel', 'expire', 'deny'], true)) {
            if ($specialBooking->status === 'pending_payment') {
                $specialBooking->update([
                    'status' => 'expired',
                    'payment_status' => $status,
                ]);
            }

            UserNotification::create([
                'user_id' => $specialBooking->user_id,
                'title' => 'Pembayaran special program gagal',
                'message' => 'Pembayaran special program tidak berhasil atau kedaluwarsa.',
                'type' => 'special_program_booking_expired',
                'data' => [
                    'booking_id' => \Illuminate\Support\Facades\Crypt::encryptString((string) $specialBooking->id),
                    'type' => 'special_program',
                    'category' => 'special_program',
                ],
            ]);
        }

        if ($souvenirOrder && in_array($status, ['cancel', 'expire', 'deny'], true)) {
            if ($souvenirOrder->status === 'pending_payment') {
                $souvenirOrder->update([
                    'status' => 'expired',
                    'payment_status' => $status,
                ]);
            }

            UserNotification::create([
                'user_id' => $souvenirOrder->user_id,
                'title' => 'Pembayaran souvenir gagal',
                'message' => 'Pembayaran souvenir tidak berhasil atau kedaluwarsa.',
                'type' => 'souvenir_booking_expired',
                'data' => [
                    'booking_id' => \Illuminate\Support\Facades\Crypt::encryptString((string) $souvenirOrder->id),
                    'category' => 'souvenir',
                ],
            ]);
        }

        return response('OK', 200);
        } finally {
            $callbackLock->release();
        }
    }

    private function bookingCannotTransitionToPaid(
        ?Booking $booking,
        ?WisataBooking $wisataBooking,
        ?EventBooking $eventBooking,
        ?AcademyBooking $academyBooking,
        ?SpecialProgramBooking $specialBooking,
        ?SouvenirOrder $souvenirOrder
    ): bool {
        $terminalStatuses = ['cancelled', 'expired', 'completed', 'no_show'];

        foreach ([$booking, $wisataBooking, $eventBooking, $academyBooking, $specialBooking, $souvenirOrder] as $record) {
            if ($record && in_array((string) $record->status, $terminalStatuses, true)) {
                return true;
            }
        }

        return false;
    }

    private function sendPaymentPush(int $userId, string $title, string $message, array $data = []): void
    {
        try {
            app(PushNotificationService::class)->sendToUser($userId, $title, $message, $data);
        } catch (\Throwable $exception) {
            Log::warning('Push notification failed', [
                'user_id' => $userId,
                'error' => $exception->getMessage(),
            ]);
        }
    }

    private function callbackAmountMatches(
        string $grossAmount,
        ?Payment $payment,
        ?Booking $booking,
        ?WisataPayment $wisataPayment,
        ?WisataBooking $wisataBooking,
        ?EventPayment $eventPayment,
        ?EventBooking $eventBooking,
        ?AcademyPayment $academyPayment,
        ?AcademyBooking $academyBooking,
        ?SpecialProgramPayment $specialPayment,
        ?SpecialProgramBooking $specialBooking,
        ?SouvenirOrder $souvenirOrder
    ): bool {
        $expected = $payment?->gross_amount
            ?? $booking?->total
            ?? $wisataPayment?->gross_amount
            ?? $wisataBooking?->total_price
            ?? $eventPayment?->gross_amount
            ?? $eventBooking?->total_price
            ?? $academyPayment?->gross_amount
            ?? $academyBooking?->total_price
            ?? $specialPayment?->gross_amount
            ?? $specialBooking?->total_price
            ?? $souvenirOrder?->total_price;

        if ($expected === null) {
            return false;
        }

        if (! preg_match('/\A([0-9]+)(?:\.([0-9]{1,2}))?\z/', $grossAmount, $matches)) {
            return false;
        }

        if (isset($matches[2]) && (int) str_pad($matches[2], 2, '0') !== 0) {
            return false;
        }

        return (int) $matches[1] === (int) $expected;
    }

    private function bookingAlreadyPaid(
        ?Booking $booking,
        ?WisataBooking $wisataBooking,
        ?EventBooking $eventBooking,
        ?AcademyBooking $academyBooking,
        ?SpecialProgramBooking $specialBooking,
        ?SouvenirOrder $souvenirOrder
    ): bool {
        foreach ([$booking, $wisataBooking, $eventBooking, $academyBooking, $specialBooking, $souvenirOrder] as $record) {
            if ($record && (string) $record->status === 'paid') {
                return true;
            }
        }

        return false;
    }
}
