<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EventAuditLog;
use App\Models\EventOrganizer;
use App\Models\MitraEventOnboarding;
use App\Models\User;
use App\Services\MitraDeletionService;
use App\Support\AdminDataScope;
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

        if (AdminDataScope::canViewAll($request->user())) {
            $this->syncMitraEventOrganizers();
        }

        $query = EventOrganizer::query()
            ->with(['user', 'onboarding'])
            ->whereNotNull('user_id')
            ->latest();
        if (! AdminDataScope::canViewAll($request->user())) {
            $query->where('user_id', $request->user()?->id ?? 0);
        }
        if ($status) {
            $query->where('status', $status);
        }

        return Inertia::render('admin/events/organizers/index', [
            'organizers' => $query->paginate(\App\Support\PaginationOptions::perPage())->withQueryString()->through(function (EventOrganizer $organizer) {
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
            'canManageMitraEvent' => AdminDataScope::canViewAll($request->user()),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        if (! AdminDataScope::canViewAll($request->user())) {
            return $this->storeOwnedOrganizer($request);
        }

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
        $this->authorizeOrganizer($organizer, request());

        return Inertia::render('admin/events/organizers/show', [
            'organizer' => $organizer->load(['user', 'onboarding']),
            'canManageMitraEvent' => AdminDataScope::canViewAll(request()->user()),
        ]);
    }

    public function updateStatus(Request $request, EventOrganizer $organizer): RedirectResponse
    {
        abort_unless(AdminDataScope::canViewAll($request->user()), 403);

        $data = $request->validate([
            'status' => ['required', 'in:pending,verified,suspended'],
            'notes' => ['required_if:status,suspended', 'nullable', 'string'],
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

    public function destroy(Request $request, EventOrganizer $organizer, MitraDeletionService $mitraDeletion): RedirectResponse
    {
        abort_unless(AdminDataScope::canViewAll($request->user()), 403);

        $mitraDeletion->deleteEventOrganizer($organizer);

        return back()->with('status', 'mitra-event-deleted');
    }

    private function storeOwnedOrganizer(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'eo_name' => ['nullable', 'string', 'max:255'],
        ]);

        $user = $request->user();
        $organizerName = $data['eo_name'] ?: $data['name'];

        MitraEventOnboarding::query()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'current_step' => 4,
                'eo_name' => $organizerName,
                'responsible_name' => $data['name'],
                'responsible_phone' => $data['phone'] ?? null,
                'responsible_role' => 'admin_eo',
                'operational_phone' => $data['phone'] ?? null,
                'operational_email' => $data['email'] ?? $user->email,
                'verification_status' => 'verified',
                'verification_reason' => null,
            ]
        );

        EventOrganizer::query()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'name' => $organizerName,
                'email' => $data['email'] ?? $user->email,
                'phone' => $data['phone'] ?? null,
                'status' => 'verified',
                'notes' => 'Organizer event milik akun RBAC.',
            ]
        );

        return back()->with('status', 'event-organizer-saved');
    }

    private function syncMitraEventOrganizers(): void
    {
        $eventUserIds = User::query()
            ->where('role', 'mitra')
            ->where('mitra_onboarding_type', 'event')
            ->pluck('id');

        if ($eventUserIds->isEmpty()) {
            return;
        }

        $existingOrganizerUserIds = EventOrganizer::query()
            ->whereIn('user_id', $eventUserIds)
            ->pluck('user_id')
            ->all();

        $missingUserIds = $eventUserIds->diff($existingOrganizerUserIds);

        if ($missingUserIds->isEmpty()) {
            return;
        }

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

    private function authorizeOrganizer(EventOrganizer $organizer, Request $request): void
    {
        if (AdminDataScope::canViewAll($request->user())) {
            return;
        }

        abort_unless((int) $organizer->user_id === (int) ($request->user()?->id ?? 0), 404);
    }
}
