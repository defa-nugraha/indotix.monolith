<?php

namespace App\Services;

use App\Models\MitraWisataOnboarding;
use App\Models\WisataBooking;
use App\Models\WisataBookingItem;
use App\Models\WisataTicketScan;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class WisataTicketUsageService
{
    public function buildMerchantQrData(MitraWisataOnboarding $destination): string
    {
        return 'INDOTIX|WISATA_GATE|'.Crypt::encryptString((string) $destination->id);
    }

    public function resolveDestinationFromQr(string $qrData): MitraWisataOnboarding
    {
        $payload = trim($qrData);
        if ($payload === '') {
            throw ValidationException::withMessages([
                'qr_data' => 'QR masuk tidak valid.',
            ]);
        }

        if (str_contains($payload, 'qr=')) {
            $query = parse_url($payload, PHP_URL_QUERY);
            parse_str((string) $query, $parts);
            $payload = (string) ($parts['qr'] ?? $payload);
        }

        $parts = explode('|', $payload);
        if (count($parts) !== 3 || $parts[0] !== 'INDOTIX' || $parts[1] !== 'WISATA_GATE') {
            throw ValidationException::withMessages([
                'qr_data' => 'QR ini bukan QR masuk wisata Indotix.',
            ]);
        }

        try {
            $destinationId = (int) Crypt::decryptString($parts[2]);
        } catch (\Throwable) {
            throw ValidationException::withMessages([
                'qr_data' => 'QR masuk tidak dapat dibaca.',
            ]);
        }

        return MitraWisataOnboarding::query()
            ->publiclyVisible()
            ->findOrFail($destinationId);
    }

    public function ticketsForUser(int $userId, MitraWisataOnboarding $destination): array
    {
        $bookings = WisataBooking::query()
            ->where('user_id', $userId)
            ->where('mitra_wisata_onboarding_id', $destination->id)
            ->whereIn('status', ['paid', 'completed'])
            ->with(['items.ticket', 'ticket'])
            ->latest('visit_date')
            ->get();

        $bookings->each(fn (WisataBooking $booking) => $this->ensureBookingItems($booking));
        $bookings->loadMissing(['items.ticket']);

        return $bookings
            ->flatMap(function (WisataBooking $booking) {
                return $booking->items->map(function (WisataBookingItem $item) use ($booking) {
                    $visitDate = $booking->visit_date;
                    $isVisitDateToday = $visitDate?->isSameDay(now()) ?? false;
                    $remaining = $item->remainingQuantity();

                    return [
                        'item_id' => $item->id,
                        'booking_id' => $booking->id,
                        'booking_code' => $booking->booking_code,
                        'ticket_name' => $item->ticket_name ?? $item->ticket?->name ?? 'Tiket Wisata',
                        'visit_date' => $visitDate?->toDateString(),
                        'quantity' => (int) $item->quantity,
                        'used_quantity' => (int) $item->used_quantity,
                        'remaining_quantity' => $remaining,
                        'usable_today' => $isVisitDateToday && $remaining > 0 && $booking->status === 'paid',
                        'status' => $booking->status,
                    ];
                });
            })
            ->values()
            ->all();
    }

    public function useTicket(int $userId, string $qrData, int $bookingItemId): array
    {
        $destination = $this->resolveDestinationFromQr($qrData);
        $pendingAnomaly = null;

        try {
            return DB::transaction(function () use ($userId, $destination, $bookingItemId, &$pendingAnomaly) {
                $item = WisataBookingItem::query()
                    ->whereKey($bookingItemId)
                    ->whereHas('booking', function ($query) use ($userId, $destination) {
                        $query
                            ->where('user_id', $userId)
                            ->where('mitra_wisata_onboarding_id', $destination->id)
                            ->whereIn('status', ['paid', 'completed']);
                    })
                    ->lockForUpdate()
                    ->first();

                if (! $item) {
                    throw ValidationException::withMessages([
                        'ticket' => 'Tiket tidak ditemukan untuk QR masuk ini.',
                    ]);
                }

                $booking = WisataBooking::query()
                    ->whereKey($item->wisata_booking_id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if (! $booking->visit_date?->isSameDay(now())) {
                    $pendingAnomaly = [$booking->id, $item->id, $userId];
                    throw ValidationException::withMessages([
                        'ticket' => 'Tiket hanya dapat digunakan pada tanggal kunjungan.',
                    ]);
                }

                if ($item->remainingQuantity() < 1) {
                    $pendingAnomaly = [$booking->id, $item->id, $userId];
                    throw ValidationException::withMessages([
                        'ticket' => 'Tiket ini sudah pernah digunakan.',
                    ]);
                }

                if ($booking->status !== 'paid') {
                    $pendingAnomaly = [$booking->id, $item->id, $userId];
                    throw ValidationException::withMessages([
                        'ticket' => 'Tiket ini sudah selesai digunakan.',
                    ]);
                }

                $item->forceFill([
                    'used_quantity' => (int) $item->used_quantity + 1,
                ])->save();
                $this->recordScan($booking, $item, $userId, false, 1);

                $remaining = WisataBookingItem::query()
                    ->where('wisata_booking_id', $booking->id)
                    ->get()
                    ->sum(fn (WisataBookingItem $row) => $row->remainingQuantity());

                if ($remaining < 1) {
                    $booking->update(['status' => 'completed']);
                }

                return [
                    'destination_name' => $destination->destination_name,
                    'booking_code' => $booking->booking_code,
                    'ticket_name' => $item->ticket_name ?? $item->ticket?->name ?? 'Tiket Wisata',
                    'remaining_quantity' => $item->remainingQuantity(),
                ];
            });
        } catch (ValidationException $exception) {
            $this->recordPendingAnomaly($pendingAnomaly);
            throw $exception;
        }
    }

    private function ensureBookingItems(WisataBooking $booking): void
    {
        if ($booking->items instanceof Collection && $booking->items->isNotEmpty()) {
            return;
        }

        $booking->items()->create([
            'wisata_ticket_id' => $booking->wisata_ticket_id,
            'ticket_name' => $booking->ticket?->name ?? 'Tiket Wisata',
            'quantity' => max(1, (int) $booking->quantity),
            'used_quantity' => min(
                max(1, (int) $booking->quantity),
                (int) $booking->scans()->where('is_anomaly', false)->sum('quantity')
            ),
            'unit_price' => (int) $booking->unit_price,
            'subtotal' => (int) ($booking->subtotal_price ?: $booking->total_price),
        ]);

        $booking->unsetRelation('items');
    }

    private function recordScan(
        WisataBooking $booking,
        WisataBookingItem $item,
        int $userId,
        bool $isAnomaly,
        int $quantity
    ): void {
        WisataTicketScan::create([
            'wisata_booking_id' => $booking->id,
            'wisata_booking_item_id' => $item->id,
            'user_id' => $userId,
            'quantity' => $quantity,
            'scan_source' => 'user_scan_mitra_qr',
            'scanned_at' => now(),
            'officer_name' => 'User',
            'location' => $booking->destination?->destination_name,
            'is_anomaly' => $isAnomaly,
        ]);
    }

    private function recordPendingAnomaly(?array $pendingAnomaly): void
    {
        if (! $pendingAnomaly) {
            return;
        }

        [$bookingId, $itemId, $userId] = $pendingAnomaly;
        $booking = WisataBooking::query()->find($bookingId);
        $item = WisataBookingItem::query()->find($itemId);

        if (! $booking || ! $item) {
            return;
        }

        $this->recordScan($booking, $item, (int) $userId, true, 0);
    }
}
