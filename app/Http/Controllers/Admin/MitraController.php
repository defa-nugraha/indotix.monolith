<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MitraOnboarding;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MitraController extends Controller
{
    public function index(Request $request): Response
    {
        $query = User::query()
            ->where('role', 'mitra')
            ->with(['mitraOnboarding']);

        if ($request->filled('search')) {
            $term = '%'.$request->string('search')->toString().'%';
            $query->where(function ($builder) use ($term) {
                $builder->where('name', 'like', $term)
                    ->orWhere('email', 'like', $term);
            });
        }

        if ($request->filled('verification_status')) {
            $query->whereHas('mitraOnboarding', function ($builder) use ($request) {
                $builder->where('verification_status', $request->string('verification_status')->toString());
            });
        }

        if ($request->filled('payout_status')) {
            $query->whereHas('mitraOnboarding', function ($builder) use ($request) {
                $builder->where('payout_status', $request->string('payout_status')->toString());
            });
        }

        if ($request->filled('suspended')) {
            $isSuspended = $request->string('suspended')->toString() === 'suspended';
            $query->where('is_suspended', $isSuspended);
        }

        $paginator = $query->latest()->paginate(10)->withQueryString();
        $cityCodes = $paginator->getCollection()
            ->map(fn (User $user) => $user->mitraOnboarding?->city_code)
            ->filter()
            ->unique()
            ->values()
            ->all();
        $cityNames = \App\Models\Regency::query()
            ->whereIn('code', $cityCodes)
            ->pluck('name', 'code');

        $mitra = $paginator->through(function (User $user) use ($cityNames) {
            $onboarding = $user->mitraOnboarding;
            $cityCode = $onboarding?->city_code;

            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'verification_status' => $onboarding?->verification_status ?? 'draft',
                'payout_status' => $onboarding?->payout_status ?? 'draft',
                'is_suspended' => (bool) $user->is_suspended,
                'hotel_name' => $onboarding?->hotel_name,
                'city_name' => $cityCode ? ($cityNames[$cityCode] ?? null) : null,
                'updated_at' => optional($onboarding?->updated_at)->toDateTimeString(),
            ];
        });

        return Inertia::render('admin/mitra/index', [
            'mitra' => $mitra,
            'filters' => $request->only(['search', 'verification_status', 'payout_status', 'suspended']),
            'verificationStatuses' => ['draft', 'pending', 'verified', 'rejected'],
            'payoutStatuses' => ['draft', 'pending', 'verified', 'rejected'],
            'suspensionStatuses' => ['active', 'suspended'],
        ]);
    }

    public function show(User $user): Response
    {
        abort_unless($user->role === 'mitra', 404);

        $onboarding = MitraOnboarding::query()->firstOrCreate([
            'user_id' => $user->id,
        ]);

        $cityName = null;
        if ($onboarding->city_code) {
            $cityName = \App\Models\Regency::query()
                ->where('code', $onboarding->city_code)
                ->value('name');
        }

        return Inertia::render('admin/mitra/show', [
            'mitra' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_suspended' => (bool) $user->is_suspended,
                'suspended_reason' => $user->suspended_reason,
                'suspended_at' => optional($user->suspended_at)->toDateTimeString(),
            ],
            'onboarding' => $onboarding,
            'cityName' => $cityName,
        ]);
    }

    public function verify(Request $request, User $user): RedirectResponse
    {
        abort_unless($user->role === 'mitra', 404);

        $data = $request->validate([
            'action' => ['required', 'in:approve,reject'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $onboarding = MitraOnboarding::query()->firstOrCreate([
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

        $onboarding = MitraOnboarding::query()->firstOrCreate([
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
}
