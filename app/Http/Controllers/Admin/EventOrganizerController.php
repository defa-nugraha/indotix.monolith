<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EventAuditLog;
use App\Models\EventAttendee;
use App\Models\EventBooking;
use App\Models\EventCommission;
use App\Models\EventDispute;
use App\Models\EventOrganizer;
use App\Models\EventPayment;
use App\Models\EventRefund;
use App\Models\EventScan;
use App\Models\EventSettlement;
use App\Models\EventTicket;
use App\Models\Event;
use App\Models\MitraEventOnboarding;
use App\Models\MitraEventStaff;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class EventOrganizerController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->string('status')->toString();
        $eventUserIds = User::query()
            ->where('role', 'mitra')
            ->where('mitra_onboarding_type', 'event')
            ->pluck('id');

        if ($eventUserIds->isNotEmpty()) {
            $existingOrganizerUserIds = EventOrganizer::query()
                ->whereIn('user_id', $eventUserIds)
                ->pluck('user_id')
                ->all();

            $missingUserIds = $eventUserIds->diff($existingOrganizerUserIds);

            if ($missingUserIds->isNotEmpty()) {
                $onboardings = MitraEventOnboarding::query()
                    ->whereIn('user_id', $missingUserIds)
                    ->with('user')
                    ->get();

                foreach ($onboardings as $onboarding) {
                    $mappedStatus = match ($onboarding->verification_status) {
                        'verified' => 'verified',
                        'rejected' => 'suspended',
                        default => 'pending',
                    };

                    EventOrganizer::updateOrCreate(
                        ['user_id' => $onboarding->user_id],
                        [
                            'name' => $onboarding->eo_name ?: ($onboarding->responsible_name ?? 'Mitra Event'),
                            'email' => $onboarding->user?->email,
                            'phone' => $onboarding->responsible_phone,
                            'status' => $mappedStatus,
                            'notes' => $onboarding->verification_reason,
                            'documents' => [
                                'responsible_name' => $onboarding->responsible_name,
                                'responsible_role' => $onboarding->responsible_role,
                                'legal_doc_type' => $onboarding->legal_doc_type,
                                'legal_doc_number' => $onboarding->legal_doc_number,
                                'legal_doc_path' => $onboarding->legal_doc_path,
                                'ktp_path' => $onboarding->ktp_path,
                                'selfie_ktp_path' => $onboarding->selfie_ktp_path,
                                'bank_name' => $onboarding->bank_name,
                                'bank_account_number' => $onboarding->bank_account_number,
                                'bank_account_name' => $onboarding->bank_account_name,
                                'bank_account_relation' => $onboarding->bank_account_relation,
                                'operational_phone' => $onboarding->operational_phone,
                                'operational_email' => $onboarding->operational_email,
                                'operational_hours' => $onboarding->operational_hours,
                            ],
                        ]
                    );
                }
            }
        }

        $query = EventOrganizer::query()
            ->with(['user', 'onboarding'])
            ->whereNotNull('user_id')
            ->latest();
        if ($status) {
            $query->where('status', $status);
        }

        return Inertia::render('admin/events/organizers/index', [
            'organizers' => $query->paginate(20)->withQueryString()->through(function (EventOrganizer $organizer) {
                return [
                    'id' => $organizer->id,
                    'name' => $organizer->name,
                    'email' => $organizer->email,
                    'phone' => $organizer->phone,
                    'status' => $organizer->status,
                    'verification_status' => $organizer->onboarding?->verification_status,
                ];
            }),
            'filters' => [
                'status' => $status,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => ['nullable', 'string', 'min:8', 'max:255'],
            'eo_name' => ['nullable', 'string', 'max:255'],
        ]);

        $password = $data['password'] ?? Str::random(12);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'password' => $password,
            'role' => 'mitra',
            'mitra_onboarding_type' => 'event',
        ]);

        MitraEventOnboarding::query()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'eo_name' => $data['eo_name'] ?? null,
                'responsible_name' => $data['name'],
                'responsible_phone' => $data['phone'] ?? null,
            ]
        );

        EventOrganizer::query()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'name' => $data['eo_name'] ?? $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'status' => 'pending',
            ]
        );

        return back()->with('status', 'mitra-event-created');
    }

    public function show(EventOrganizer $organizer): Response
    {
        return Inertia::render('admin/events/organizers/show', [
            'organizer' => $organizer->load(['user', 'onboarding']),
        ]);
    }

    public function updateStatus(Request $request, EventOrganizer $organizer): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:pending,verified,suspended'],
            'notes' => ['nullable', 'string'],
        ]);

        $organizer->update([
            'status' => $data['status'],
            'notes' => $data['notes'] ?? $organizer->notes,
        ]);

        $onboarding = MitraEventOnboarding::query()
            ->where('user_id', $organizer->user_id)
            ->first();
        if ($onboarding) {
            $verificationStatus = match ($data['status']) {
                'verified' => 'verified',
                'pending' => 'pending',
                'suspended' => 'rejected',
                default => $onboarding->verification_status,
            };
            $onboarding->update([
                'verification_status' => $verificationStatus,
                'verification_reason' => $data['status'] === 'suspended' ? ($data['notes'] ?? $onboarding->verification_reason) : null,
            ]);
        }

        EventAuditLog::create([
            'admin_id' => $request->user()->id,
            'action' => 'event_organizer_status_updated',
            'subject_type' => EventOrganizer::class,
            'subject_id' => $organizer->id,
            'metadata' => $data,
        ]);

        return back();
    }

    public function destroy(Request $request, EventOrganizer $organizer): RedirectResponse
    {
        $eventIds = Event::query()
            ->where('event_organizer_id', $organizer->id)
            ->where('event_type', 'event')
            ->pluck('id');
        $bookingIds = $eventIds->isNotEmpty()
            ? EventBooking::query()->whereIn('event_id', $eventIds)->pluck('id')
            : collect();

        $onboarding = MitraEventOnboarding::query()->where('user_id', $organizer->user_id)->first();
        $counts = [
            'event' => $eventIds->count(),
            'tiket' => EventTicket::query()->whereIn('event_id', $eventIds)->count(),
            'booking' => $bookingIds->count(),
            'pembayaran' => EventPayment::query()->whereIn('event_booking_id', $bookingIds)->count(),
            'refund' => EventRefund::query()->whereIn('event_booking_id', $bookingIds)->count(),
            'dispute' => EventDispute::query()->whereIn('event_booking_id', $bookingIds)->count(),
            'scan' => EventScan::query()->whereIn('event_booking_id', $bookingIds)->count(),
            'attendee' => EventAttendee::query()->whereIn('event_booking_id', $bookingIds)->count(),
            'komisi' => EventCommission::query()->whereIn('event_id', $eventIds)->count(),
            'settlement' => EventSettlement::query()->where('event_organizer_id', $organizer->id)->count(),
            'staff' => $onboarding
                ? MitraEventStaff::query()->where('mitra_event_onboarding_id', $onboarding->id)->count()
                : 0,
        ];

        $blocked = array_filter($counts, fn ($count) => $count > 0);
        if ($blocked) {
            $details = collect($blocked)
                ->map(fn ($count, $key) => "{$key} ({$count})")
                ->implode(', ');

            return back()->withErrors([
                'organizer' => "Mitra event tidak dapat dihapus karena masih memiliki data: {$details}.",
            ]);
        }

        if ($onboarding) {
            MitraEventStaff::query()->where('mitra_event_onboarding_id', $onboarding->id)->delete();
            $onboarding->delete();
        }

        $user = $organizer->user;
        $organizer->delete();
        if ($user) {
            $user->delete();
        }

        return back()->with('status', 'mitra-event-deleted');
    }
}
