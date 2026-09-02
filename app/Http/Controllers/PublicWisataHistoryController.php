<?php

namespace App\Http\Controllers;

use App\Models\WisataBooking;
use App\Services\ProductReviewService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PublicWisataHistoryController extends Controller
{
    public function index(Request $request): Response
    {
        $userId = (int) $request->user()->id;

        $bookings = WisataBooking::query()
            ->where('user_id', $request->user()->id)
            ->with(['destination', 'ticket', 'items.ticket'])
            ->latest()
            ->get()
            ->map(function (WisataBooking $booking) use ($userId) {
                $destination = $booking->destination;

                return [
                    'id' => $booking->id,
                    'encrypted_id' => Crypt::encryptString((string) $booking->id),
                    'booking_code' => $booking->booking_code,
                    'destination_name' => $destination?->destination_name,
                    'city_name' => $this->resolveCityName($destination?->city_code),
                    'address' => $destination?->address_full,
                    'visit_date' => $booking->visit_date?->toDateString(),
                    'quantity' => $booking->quantity,
                    'total' => $booking->total_price,
                    'status' => $booking->status,
                    'payment_status' => $booking->payment_status,
                    'payment_deadline' => $booking->payment_deadline?->toIso8601String(),
                    'guest_name' => $booking->guest_name,
                    'guest_email' => $booking->guest_email,
                    'guest_phone' => $booking->guest_phone,
                    'created_at' => $booking->created_at?->toIso8601String(),
                    'midtrans_order_id' => $booking->midtrans_order_id,
                    'ticket_name' => $booking->ticket?->name,
                    'items' => $this->lineItems($booking),
                    'review_url' => $booking->mitra_wisata_onboarding_id
                        ? '/wisata/'.Crypt::encryptString((string) $booking->mitra_wisata_onboarding_id)
                        : null,
                    'can_review' => $booking->mitra_wisata_onboarding_id
                        ? ProductReviewService::hasUsedBooking($userId, 'wisata', (int) $booking->mitra_wisata_onboarding_id)
                        : false,
                ];
            });

        return Inertia::render('public/wisata/history', [
            'bookings' => $bookings,
        ]);
    }

    private function resolveCityName(?string $cityCode): ?string
    {
        if (! $cityCode) {
            return null;
        }

        return DB::table('regencies')->where('code', $cityCode)->value('name');
    }

    private function lineItems(WisataBooking $booking): array
    {
        $booking->loadMissing(['ticket', 'items.ticket']);

        if ($booking->items->isEmpty()) {
            return [[
                'ticket_id' => (int) $booking->wisata_ticket_id,
                'name' => $booking->ticket?->name ?? 'Tiket Wisata',
                'quantity' => (int) $booking->quantity,
                'unit_price' => (int) $booking->unit_price,
                'subtotal' => (int) ($booking->subtotal_price ?: $booking->total_price),
            ]];
        }

        return $booking->items
            ->map(fn ($item) => [
                'ticket_id' => (int) $item->wisata_ticket_id,
                'name' => $item->ticket_name ?? $item->ticket?->name ?? 'Tiket Wisata',
                'quantity' => (int) $item->quantity,
                'unit_price' => (int) $item->unit_price,
                'subtotal' => (int) $item->subtotal,
            ])
            ->values()
            ->all();
    }
}
