<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MitraWisataOnboarding;
use App\Models\User;
use App\Services\MitraDeletionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class MitraWisataController extends Controller
{
    public function index(Request $request): Response
    {
        $query = User::query()
            ->where('role', 'mitra')
            ->where('mitra_onboarding_type', 'wisata')
            ->with(['mitraWisataOnboarding']);

        if ($request->filled('search')) {
            $term = '%'.$request->string('search')->toString().'%';
            $query->where(function ($builder) use ($term) {
                $builder->where('name', 'like', $term)
                    ->orWhere('email', 'like', $term);
            });
        }

        if ($request->filled('verification_status')) {
            $query->whereHas('mitraWisataOnboarding', function ($builder) use ($request) {
                $builder->where('verification_status', $request->string('verification_status')->toString());
            });
        }

        if ($request->filled('payout_status')) {
            $query->whereHas('mitraWisataOnboarding', function ($builder) use ($request) {
                $builder->where('payout_status', $request->string('payout_status')->toString());
            });
        }

        if ($request->filled('suspended')) {
            $isSuspended = $request->string('suspended')->toString() === 'suspended';
            $query->where('is_suspended', $isSuspended);
        }

        $paginator = $query->latest()->paginate(\App\Support\PaginationOptions::perPage())->withQueryString();
        $cityCodes = $paginator->getCollection()
            ->map(fn (User $user) => $user->mitraWisataOnboarding?->city_code)
            ->filter()
            ->unique()
            ->values()
            ->all();
        $provinceCodes = $paginator->getCollection()
            ->map(fn (User $user) => $user->mitraWisataOnboarding?->province_code)
            ->filter()
            ->unique()
            ->values()
            ->all();

        $cityNames = \App\Models\Regency::query()
            ->whereIn('code', $cityCodes)
            ->pluck('name', 'code');
        $provinceNames = \App\Models\Province::query()
            ->whereIn('code', $provinceCodes)
            ->pluck('name', 'code');

        $mitra = $paginator->through(function (User $user) use ($cityNames, $provinceNames) {
            $onboarding = $user->mitraWisataOnboarding;
            $cityCode = $onboarding?->city_code;
            $provinceCode = $onboarding?->province_code;

            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'verification_status' => $onboarding?->verification_status ?? 'draft',
                'payout_status' => $onboarding?->payout_status ?? 'draft',
                'is_suspended' => (bool) $user->is_suspended,
                'destination_name' => $onboarding?->destination_name,
                'destination_type' => $onboarding?->destination_type,
                'city_name' => $cityCode ? ($cityNames[$cityCode] ?? null) : null,
                'province_name' => $provinceCode ? ($provinceNames[$provinceCode] ?? null) : null,
                'updated_at' => optional($onboarding?->updated_at)->toDateTimeString(),
            ];
        });

        return Inertia::render('admin/mitra-wisata/index', [
            'mitra' => $mitra,
            'filters' => $request->only(['search', 'verification_status', 'payout_status', 'suspended']),
            'verificationStatuses' => ['draft', 'pending', 'verified', 'rejected'],
            'payoutStatuses' => ['draft', 'pending', 'verified', 'rejected'],
            'suspensionStatuses' => ['active', 'suspended'],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => ['nullable', 'string', 'min:8', 'max:255'],
            'destination_name' => ['nullable', 'string', 'max:255'],
            'destination_type' => ['nullable', 'string', 'max:80'],
            'verification_status' => ['nullable', 'in:draft,pending,verified,rejected'],
            'payout_status' => ['nullable', 'in:draft,pending,verified,rejected'],
            'is_suspended' => ['nullable', 'boolean'],
            'suspended_reason' => [Rule::requiredIf($request->boolean('is_suspended')), 'nullable', 'string', 'max:1000'],
        ]);

        $password = $data['password'] ?? Str::random(12);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'password' => $password,
            'role' => 'mitra',
            'mitra_onboarding_type' => 'wisata',
            'is_suspended' => (bool) ($data['is_suspended'] ?? false),
            'suspended_at' => ! empty($data['is_suspended']) ? now() : null,
            'suspended_reason' => ! empty($data['is_suspended']) ? ($data['suspended_reason'] ?? null) : null,
        ]);

        MitraWisataOnboarding::query()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'destination_name' => $data['destination_name'] ?? null,
                'destination_type' => $data['destination_type'] ?? null,
                'responsible_name' => $data['name'],
                'responsible_phone' => $data['phone'] ?? null,
                'verification_status' => $data['verification_status'] ?? 'draft',
                'payout_status' => $data['payout_status'] ?? 'draft',
            ]
        );

        return back()->with('status', 'mitra-wisata-created');
    }

    public function show(User $user): Response
    {
        abort_unless($user->role === 'mitra', 404);

        $onboarding = MitraWisataOnboarding::query()->firstOrCreate([
            'user_id' => $user->id,
        ]);

        $cityName = null;
        if ($onboarding->city_code) {
            $cityName = \App\Models\Regency::query()
                ->where('code', $onboarding->city_code)
                ->value('name');
        }

        $provinceName = null;
        if ($onboarding->province_code) {
            $provinceName = \App\Models\Province::query()
                ->where('code', $onboarding->province_code)
                ->value('name');
        }

        return Inertia::render('admin/mitra-wisata/show', [
            'mitra' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_suspended' => (bool) $user->is_suspended,
                'suspended_reason' => $user->suspended_reason,
                'suspended_at' => optional($user->suspended_at)->toDateTimeString(),
            ],
            'onboarding' => $onboarding,
            'sensitiveDocumentUrls' => [
                'ktp' => $onboarding->ktp_path ? route('admin.mitra-wisata.documents.show', ['user' => $user->id, 'type' => 'ktp']) : null,
                'selfie' => $onboarding->selfie_ktp_path ? route('admin.mitra-wisata.documents.show', ['user' => $user->id, 'type' => 'selfie']) : null,
                'legal' => $onboarding->legal_doc_path ? route('admin.mitra-wisata.documents.show', ['user' => $user->id, 'type' => 'legal']) : null,
            ],
            'cityName' => $cityName,
            'provinceName' => $provinceName,
        ]);
    }

    public function verify(Request $request, User $user): RedirectResponse
    {
        abort_unless($user->role === 'mitra', 404);

        $data = $request->validate([
            'action' => ['required', 'in:approve,reject'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $onboarding = MitraWisataOnboarding::query()->firstOrCreate([
            'user_id' => $user->id,
        ]);

        if ($data['action'] === 'reject' && empty($data['reason'])) {
            return back()->withErrors([
                'reason' => 'Alasan penolakan wajib diisi.',
            ]);
        }

        $onboarding->update([
            'verification_status' => $data['action'] === 'approve' ? 'verified' : 'rejected',
            'verification_reason' => $data['action'] === 'reject' ? $data['reason'] : null,
        ]);

        return back()->with('status', 'verification-updated');
    }

    public function payout(Request $request, User $user): RedirectResponse
    {
        abort_unless($user->role === 'mitra', 404);

        $data = $request->validate([
            'action' => ['required', 'in:approve,reject'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $onboarding = MitraWisataOnboarding::query()->firstOrCreate([
            'user_id' => $user->id,
        ]);

        if ($data['action'] === 'reject' && empty($data['reason'])) {
            return back()->withErrors([
                'reason' => 'Alasan penolakan wajib diisi.',
            ]);
        }

        $onboarding->update([
            'payout_status' => $data['action'] === 'approve' ? 'verified' : 'rejected',
            'payout_reason' => $data['action'] === 'reject' ? $data['reason'] : null,
        ]);

        return back()->with('status', 'payout-updated');
    }

    public function suspend(Request $request, User $user): RedirectResponse
    {
        abort_unless($user->role === 'mitra', 404);

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

        return back()->with('status', 'suspension-updated');
    }

    public function destroy(Request $request, User $user, MitraDeletionService $mitraDeletion): RedirectResponse
    {
        abort_unless($user->role === 'mitra', 404);
        abort_unless($user->mitra_onboarding_type === 'wisata', 404);

        $mitraDeletion->deleteWisataMitra($user);

        return back()->with('status', 'mitra-wisata-deleted');
    }
}
