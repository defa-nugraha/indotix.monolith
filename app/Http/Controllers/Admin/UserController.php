<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademyBooking;
use App\Models\Booking;
use App\Models\EventBooking;
use App\Models\SouvenirOrder;
use App\Models\User;
use App\Models\WisataBooking;
use App\Services\UserDeletionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $query = User::query()
            ->where('role', 'user');

        if ($request->filled('search')) {
            $term = '%'.$request->string('search')->toString().'%';
            $query->where(function ($builder) use ($term) {
                $builder->where('name', 'like', $term)
                    ->orWhere('email', 'like', $term)
                    ->orWhere('phone', 'like', $term);
            });
        }

        if ($request->filled('status')) {
            $isSuspended = $request->string('status')->toString() === 'suspended';
            $query->where('is_suspended', $isSuspended);
        }

        if ($request->filled('verified')) {
            $verified = $request->string('verified')->toString() === 'verified';
            $query->when($verified, fn ($builder) => $builder->whereNotNull('email_verified_at'))
                ->when(! $verified, fn ($builder) => $builder->whereNull('email_verified_at'));
        }

        $paginator = $query->latest()->paginate(\App\Support\PaginationOptions::perPage())->withQueryString();
        $users = $paginator->through(function (User $user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'gender' => $user->gender,
                'is_suspended' => (bool) $user->is_suspended,
                'email_verified_at' => optional($user->email_verified_at)->toDateTimeString(),
                'created_at' => optional($user->created_at)->toDateTimeString(),
            ];
        });

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'filters' => $request->only(['search', 'status', 'verified']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'gender' => ['nullable', 'string', 'max:20'],
            'password' => ['required', 'string', 'min:8', 'max:255'],
        ]);

        $user = User::query()->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'gender' => $data['gender'] ?? null,
            'password' => $data['password'],
            'role' => 'user',
        ]);
        $user->forceFill([
            'email_verified_at' => now(),
        ])->save();

        return back()->with('status', 'user-created');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        abort_unless($user->role === 'user', 404);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:30'],
            'gender' => ['nullable', 'string', 'max:20'],
            'password' => ['nullable', 'string', 'min:8', 'max:255'],
        ]);

        $payload = [
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'gender' => $data['gender'] ?? null,
        ];
        if (! empty($data['password'])) {
            $payload['password'] = $data['password'];
        }

        $user->fill($payload);
        $user->forceFill([
            'email_verified_at' => now(),
        ])->save();

        return back()->with('status', 'user-updated');
    }

    public function show(User $user): Response
    {
        abort_unless($user->role === 'user', 404);

        $hotelBookings = Booking::query()
            ->with('hotel:id,name')
            ->where('user_id', $user->id)
            ->latest()
            ->take(10)
            ->get()
            ->map(fn (Booking $booking) => [
                'id' => $booking->id,
                'type' => 'hotel',
                'title' => $booking->hotel?->name ?? 'Hotel',
                'code' => $booking->midtrans_order_id ?? $booking->id,
                'total' => $booking->total,
                'status' => $booking->status,
                'payment_status' => $booking->payment_status,
                'created_at' => optional($booking->created_at)->toDateTimeString(),
            ]);

        $wisataBookings = WisataBooking::query()
            ->with('destination:id,destination_name')
            ->where('user_id', $user->id)
            ->latest()
            ->take(10)
            ->get()
            ->map(fn (WisataBooking $booking) => [
                'id' => $booking->id,
                'type' => 'wisata',
                'title' => $booking->destination?->destination_name ?? 'Wisata',
                'code' => $booking->booking_code ?? $booking->id,
                'total' => $booking->total_price,
                'status' => $booking->status,
                'payment_status' => $booking->payment_status,
                'created_at' => optional($booking->created_at)->toDateTimeString(),
            ]);

        $eventBookings = EventBooking::query()
            ->with('event:id,title')
            ->where('user_id', $user->id)
            ->latest()
            ->take(10)
            ->get()
            ->map(fn (EventBooking $booking) => [
                'id' => $booking->id,
                'type' => 'event',
                'title' => $booking->event?->title ?? 'Event',
                'code' => $booking->booking_code ?? $booking->id,
                'total' => $booking->total_price,
                'status' => $booking->status,
                'payment_status' => $booking->payment_status,
                'created_at' => optional($booking->created_at)->toDateTimeString(),
            ]);

        $academyBookings = AcademyBooking::query()
            ->with('academyClass:id,title')
            ->where('user_id', $user->id)
            ->latest()
            ->take(10)
            ->get()
            ->map(fn (AcademyBooking $booking) => [
                'id' => $booking->id,
                'type' => 'academy',
                'title' => $booking->academyClass?->title ?? 'Academy',
                'code' => $booking->booking_code ?? $booking->id,
                'total' => $booking->total_price,
                'status' => $booking->status,
                'payment_status' => $booking->payment_status,
                'created_at' => optional($booking->created_at)->toDateTimeString(),
            ]);

        $specialProgramBookings = EventBooking::query()
            ->whereHas('event', fn ($q) => $q->where('event_type', 'special_program'))
            ->with('event:id,title')
            ->where('user_id', $user->id)
            ->latest()
            ->take(10)
            ->get()
            ->map(fn (EventBooking $booking) => [
                'id' => $booking->id,
                'type' => 'special_program',
                'title' => $booking->event?->title ?? 'Special Program',
                'code' => $booking->booking_code ?? $booking->id,
                'total' => $booking->total_price,
                'status' => $booking->status,
                'payment_status' => $booking->payment_status,
                'created_at' => optional($booking->created_at)->toDateTimeString(),
            ]);

        $souvenirOrders = SouvenirOrder::query()
            ->where('user_id', $user->id)
            ->latest()
            ->take(10)
            ->get()
            ->map(fn (SouvenirOrder $order) => [
                'id' => $order->id,
                'type' => 'retail_shop',
                'title' => 'Retail Shop',
                'code' => $order->midtrans_order_id ?? $order->id,
                'total' => $order->total_price,
                'status' => $order->status,
                'payment_status' => $order->payment_status,
                'created_at' => optional($order->created_at)->toDateTimeString(),
            ]);

        $transactions = collect()
            ->merge($hotelBookings)
            ->merge($wisataBookings)
            ->merge($eventBookings)
            ->merge($academyBookings)
            ->merge($specialProgramBookings)
            ->merge($souvenirOrders)
            ->sortByDesc('created_at')
            ->values()
            ->take(25)
            ->all();

        return Inertia::render('admin/users/show', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'gender' => $user->gender,
                'is_suspended' => (bool) $user->is_suspended,
                'suspended_reason' => $user->suspended_reason,
                'suspended_at' => optional($user->suspended_at)->toDateTimeString(),
                'email_verified_at' => optional($user->email_verified_at)->toDateTimeString(),
                'created_at' => optional($user->created_at)->toDateTimeString(),
            ],
            'transactions' => $transactions,
        ]);
    }

    public function suspend(Request $request, User $user): RedirectResponse
    {
        abort_unless($user->role === 'user', 404);

        $data = $request->validate([
            'action' => ['required', 'in:suspend,unsuspend'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($data['action'] === 'suspend' && empty($data['reason'])) {
            return back()->withErrors([
                'reason' => 'Alasan suspend wajib diisi.',
            ]);
        }

        $user->update([
            'is_suspended' => $data['action'] === 'suspend',
            'suspended_at' => $data['action'] === 'suspend' ? now() : null,
            'suspended_reason' => $data['action'] === 'suspend' ? $data['reason'] : null,
        ]);

        return back()->with('status', 'user-suspension-updated');
    }

    public function destroy(Request $request, User $user, UserDeletionService $userDeletion): RedirectResponse
    {
        abort_unless($user->role === 'user', 404);

        $userDeletion->deleteUser($user);

        return back()->with('status', 'user-deleted');
    }
}
