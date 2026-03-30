<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademyBooking;
use App\Models\Booking;
use App\Models\EventBooking;
use App\Models\SpecialProgramBooking;
use App\Models\SouvenirOrder;
use App\Models\WisataBooking;
use App\Services\ProductReviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class HistoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['nullable', Rule::in(['hotel', 'wisata', 'event', 'special_program', 'souvenir', 'academy'])],
            'category' => ['nullable', Rule::in(['hotel', 'wisata', 'event', 'special_program', 'souvenir', 'academy'])],
            'status' => ['nullable', 'string', 'max:50'],
            'q' => ['nullable', 'string', 'max:255'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        $type = $data['type'] ?? $data['category'] ?? null;
        $status = $data['status'] ?? null;
        $query = trim((string) ($data['q'] ?? ''));

        $applyDateFilter = function ($builder) use ($data) {
            if (! empty($data['date_from'])) {
                $builder->whereDate('created_at', '>=', $data['date_from']);
            }
            if (! empty($data['date_to'])) {
                $builder->whereDate('created_at', '<=', $data['date_to']);
            }
        };

        $userId = (int) $request->user()->id;

        $hotelBookings = collect();
        if (! $type || $type === 'hotel') {
            $hotelBookings = Booking::query()
                ->where('user_id', $userId)
                ->with(['hotel.city'])
                ->when($status, fn ($builder) => $builder->where('status', $status))
                ->tap($applyDateFilter)
                ->latest()
                ->get()
                ->map(fn (Booking $booking) => [
                    'id' => $booking->id,
                    'encrypted_id' => Crypt::encryptString((string) $booking->id),
                    'type' => 'hotel',
                    'title' => $booking->hotel?->name ?? 'Hotel',
                    'city_name' => $booking->hotel?->city?->name,
                    'address' => $booking->hotel?->address,
                    'check_in' => $booking->check_in?->toDateString(),
                    'check_out' => $booking->check_out?->toDateString(),
                    'nights' => $booking->nights,
                    'rooms_count' => $booking->rooms_count,
                    'guests_count' => $booking->guests_count,
                    'visit_date' => null,
                    'quantity' => null,
                    'total' => $booking->total,
                    'status' => $booking->status,
                    'payment_status' => $booking->payment_status,
                    'payment_deadline' => $booking->payment_deadline?->toIso8601String(),
                    'guest_name' => $booking->guest_name,
                    'guest_email' => $booking->guest_email,
                    'guest_phone' => $booking->guest_phone,
                    'created_at' => $booking->created_at?->toIso8601String(),
                    'midtrans_order_id' => $booking->midtrans_order_id,
                    'payment_url' => $this->safeRoute('booking.payment', ['booking' => Crypt::encryptString((string) $booking->id)]),
                    'detail_url' => $this->safeRoute('booking.show', ['booking' => Crypt::encryptString((string) $booking->id)]),
                    'review_url' => $booking->hotel_id
                        ? '/stay/hotels/'.$booking->hotel?->slug
                        : null,
                    'can_review' => $booking->hotel_id
                        ? $this->safeReviewCheck(fn () => ProductReviewService::hasUsedBooking($userId, 'hotel', (int) $booking->hotel_id))
                        : false,
                ]);
        }

        $wisataBookings = collect();
        if (! $type || $type === 'wisata') {
            $wisataBookings = WisataBooking::query()
                ->where('user_id', $userId)
                ->with(['destination', 'ticket'])
                ->when($status, fn ($builder) => $builder->where('status', $status))
                ->tap($applyDateFilter)
                ->latest()
                ->get()
                ->map(function (WisataBooking $booking) use ($userId) {
                    $destination = $booking->destination;

                    return [
                        'id' => $booking->id,
                        'encrypted_id' => Crypt::encryptString((string) $booking->id),
                        'type' => 'wisata',
                        'title' => $destination?->destination_name ?? 'Wisata',
                        'city_name' => $this->resolveCityName($destination?->city_code),
                        'address' => $destination?->address_full,
                        'check_in' => null,
                        'check_out' => null,
                        'nights' => null,
                        'rooms_count' => null,
                        'guests_count' => null,
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
                        'payment_url' => $this->safeRoute('wisata.booking.payment', ['booking' => Crypt::encryptString((string) $booking->id)]),
                        'detail_url' => $this->safeRoute('wisata.booking.show', ['booking' => Crypt::encryptString((string) $booking->id)]),
                        'review_url' => $booking->mitra_wisata_onboarding_id
                            ? '/wisata/'.$destination?->slug
                            : null,
                        'can_review' => $booking->mitra_wisata_onboarding_id
                            ? $this->safeReviewCheck(fn () => ProductReviewService::hasUsedBooking($userId, 'wisata', (int) $booking->mitra_wisata_onboarding_id))
                            : false,
                        'ticket_name' => $booking->ticket?->name,
                    ];
                });
        }

        $eventBookings = collect();
        if (! $type || $type === 'event') {
            $eventBookings = EventBooking::query()
                ->where('user_id', $userId)
                ->with(['event', 'ticket'])
                ->when($status, fn ($builder) => $builder->where('status', $status))
                ->tap($applyDateFilter)
                ->latest()
                ->get()
                ->map(function (EventBooking $booking) use ($userId) {
                    $event = $booking->event;

                    return [
                        'id' => $booking->id,
                        'encrypted_id' => Crypt::encryptString((string) $booking->id),
                        'type' => 'event',
                        'title' => $event?->title ?? 'Event',
                        'city_name' => $this->resolveCityName($event?->city_code),
                        'address' => $event?->address,
                        'check_in' => null,
                        'check_out' => null,
                        'nights' => null,
                        'rooms_count' => null,
                        'guests_count' => null,
                        'visit_date' => $event?->start_at?->toDateString(),
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
                        'payment_url' => $this->safeRoute('events.booking.payment', ['booking' => Crypt::encryptString((string) $booking->id)]),
                        'detail_url' => $this->safeRoute('events.booking.show', ['booking' => Crypt::encryptString((string) $booking->id)]),
                        'review_url' => $booking->event_id
                            ? '/events/'.$event?->slug
                            : null,
                        'can_review' => $booking->event_id
                            ? $this->safeReviewCheck(fn () => ProductReviewService::hasUsedBooking($userId, 'event', (int) $booking->event_id))
                            : false,
                        'ticket_name' => $booking->ticket?->name,
                    ];
                });
        }

        $specialProgramBookings = collect();
        if (! $type || $type === 'special_program') {
            $specialProgramBookings = SpecialProgramBooking::query()
                ->where('user_id', $userId)
                ->with(['program', 'variant'])
                ->when($status, fn ($builder) => $builder->where('status', $status))
                ->tap($applyDateFilter)
                ->latest()
                ->get()
                ->map(function (SpecialProgramBooking $booking) {
                    $program = $booking->program;

                    return [
                        'id' => $booking->id,
                        'encrypted_id' => Crypt::encryptString((string) $booking->id),
                        'type' => 'special_program',
                        'title' => $program?->name ?? 'Special Program',
                        'city_name' => null,
                        'address' => null,
                        'check_in' => null,
                        'check_out' => null,
                        'nights' => null,
                        'rooms_count' => null,
                        'guests_count' => null,
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
                        'payment_url' => $this->safeRoute('special-programs.booking.payment', ['booking' => Crypt::encryptString((string) $booking->id)]),
                        'detail_url' => $this->safeRoute('special-programs.booking.show', ['booking' => Crypt::encryptString((string) $booking->id)]),
                        'review_url' => $program?->slug ? '/special-programs/'.$program->slug : null,
                        'can_review' => false,
                        'ticket_name' => $booking->variant?->name,
                    ];
                });
        }

        $souvenirOrders = collect();
        if (! $type || $type === 'souvenir') {
            $souvenirOrders = SouvenirOrder::query()
                ->where('user_id', $userId)
                ->with('user')
                ->when($status, fn ($builder) => $builder->where('status', $status))
                ->tap($applyDateFilter)
                ->latest()
                ->get()
                ->map(function (SouvenirOrder $order) {
                    $shippingStatus = strtolower((string) ($order->shipping_status ?? ''));
                    $arrivedStatuses = ['delivered', 'arrived', 'sampai', 'received', 'done'];
                    $canReview = $order->status === 'completed' || in_array($shippingStatus, $arrivedStatuses, true);

                    return [
                        'id' => $order->id,
                        'encrypted_id' => Crypt::encryptString((string) $order->id),
                        'type' => 'souvenir',
                        'title' => 'Souvenir',
                        'city_name' => null,
                        'address' => $order->shipping_address,
                        'check_in' => null,
                        'check_out' => null,
                        'nights' => null,
                        'rooms_count' => null,
                        'guests_count' => null,
                        'visit_date' => null,
                        'quantity' => $order->items()->sum('quantity'),
                        'total' => $order->total_price,
                        'status' => $order->status,
                        'payment_status' => $order->payment_status,
                        'payment_deadline' => $order->payment_deadline?->toIso8601String(),
                        'guest_name' => $order->user?->name,
                        'guest_email' => $order->user?->email,
                        'guest_phone' => null,
                        'created_at' => $order->created_at?->toIso8601String(),
                        'midtrans_order_id' => $order->midtrans_order_id,
                        'payment_url' => $this->safeRoute('souvenir.booking.payment', ['order' => Crypt::encryptString((string) $order->id)]),
                        'detail_url' => $this->safeRoute('souvenir.booking.show', ['order' => Crypt::encryptString((string) $order->id)]),
                        'review_url' => $this->safeRoute('souvenir.booking.show', ['order' => Crypt::encryptString((string) $order->id)]),
                        'can_review' => $canReview,
                        'ticket_name' => null,
                    ];
                });
        }

        $academyBookings = collect();
        if (! $type || $type === 'academy') {
            $academyBookings = AcademyBooking::query()
                ->where('user_id', $userId)
                ->with(['academyClass', 'ticket'])
                ->when($status, fn ($builder) => $builder->where('status', $status))
                ->tap($applyDateFilter)
                ->latest()
                ->get()
                ->map(function (AcademyBooking $booking) use ($userId) {
                    $class = $booking->academyClass;
                    $classAvailable = (bool) $class;

                    return [
                        'id' => $booking->id,
                        'encrypted_id' => Crypt::encryptString((string) $booking->id),
                        'type' => 'academy',
                        'title' => $classAvailable ? $class->title : 'Produk tidak tersedia',
                        'city_name' => null,
                        'address' => $classAvailable ? $class->location_detail : null,
                        'check_in' => null,
                        'check_out' => null,
                        'nights' => null,
                        'rooms_count' => null,
                        'guests_count' => null,
                        'visit_date' => $classAvailable ? $class->start_at?->toDateString() : null,
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
                        'payment_url' => $this->safeRoute('academy.booking.payment', ['booking' => Crypt::encryptString((string) $booking->id)]),
                        'detail_url' => $this->safeRoute('academy.booking.show', ['booking' => Crypt::encryptString((string) $booking->id)]),
                        'review_url' => $classAvailable ? '/academy/'.$class?->slug : null,
                        'can_review' => $classAvailable
                            ? $this->safeReviewCheck(fn () => ProductReviewService::hasUsedBooking($userId, 'academy', (int) $booking->academy_class_id))
                            : false,
                        'ticket_name' => $booking->ticket?->name,
                    ];
                });
        }

        $bookings = $hotelBookings
            ->merge($wisataBookings)
            ->merge($eventBookings)
            ->merge($specialProgramBookings)
            ->merge($souvenirOrders)
            ->merge($academyBookings);

        if ($query !== '') {
            $needle = mb_strtolower($query);
            $bookings = $bookings->filter(function ($booking) use ($needle) {
                $haystack = mb_strtolower(trim(sprintf(
                    '%s %s %s',
                    $booking['title'] ?? '',
                    $booking['city_name'] ?? '',
                    $booking['address'] ?? ''
                )));

                return str_contains($haystack, $needle);
            });
        }

        $bookings = $bookings->sortByDesc('created_at')->values();

        return response()->json([
            'filters' => [
                'type' => $type,
                'status' => $status,
                'q' => $query !== '' ? $query : null,
                'date_from' => $data['date_from'] ?? null,
                'date_to' => $data['date_to'] ?? null,
            ],
            'bookings' => $bookings,
        ]);
    }

    private function resolveCityName(?string $cityCode): ?string
    {
        if (! $cityCode) {
            return null;
        }

        try {
            return DB::table('regencies')->where('code', $cityCode)->value('name');
        } catch (\Throwable $exception) {
            report($exception);
            return null;
        }
    }

    private function safeRoute(string $name, array $params = []): ?string
    {
        try {
            return \Illuminate\Support\Facades\Route::has($name) ? route($name, $params) : null;
        } catch (\Throwable $exception) {
            report($exception);
            return null;
        }
    }

    private function safeReviewCheck(\Closure $callback): bool
    {
        try {
            return (bool) $callback();
        } catch (\Throwable $exception) {
            report($exception);
            return false;
        }
    }
}
