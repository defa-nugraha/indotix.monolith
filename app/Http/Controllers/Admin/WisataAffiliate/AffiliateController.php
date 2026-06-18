<?php

namespace App\Http\Controllers\Admin\WisataAffiliate;

use App\Http\Controllers\Controller;
use App\Models\WisataAffiliate;
use App\Models\WisataAffiliateAuditLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AffiliateController extends Controller
{
    public function index(Request $request): Response
    {
        $query = WisataAffiliate::query()->latest('id');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('q')) {
            $term = $request->string('q');
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                    ->orWhere('email', 'like', "%{$term}%")
                    ->orWhere('phone', 'like', "%{$term}%");
            });
        }

        return Inertia::render('admin/wisata-affiliates/index', [
            'affiliates' => $query->paginate(\App\Support\PaginationOptions::perPage())->withQueryString(),
            'users' => \App\Models\User::query()
                ->where('role', 'user')
                ->select('id', 'name', 'email')
                ->orderBy('name')
                ->get(),
            'destinations' => \App\Models\MitraWisataOnboarding::query()
                ->select('id', 'destination_name')
                ->orderBy('destination_name')
                ->get(),
            'filters' => [
                'status' => $request->string('status')->toString(),
                'q' => $request->string('q')->toString(),
            ],
        ]);
    }

    public function show(WisataAffiliate $affiliate): Response
    {
        $affiliate->load('links', 'commissionItems', 'payouts');
        $destination = null;
        if ($affiliate->wisata_id) {
            $destination = \App\Models\MitraWisataOnboarding::query()
                ->select('id', 'destination_name')
                ->find($affiliate->wisata_id);
        }

        return Inertia::render('admin/wisata-affiliates/show', [
            'affiliate' => $affiliate,
            'destination' => $destination,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'wisata_id' => ['required', 'integer', 'exists:mitra_wisata_onboardings,id'],
            'phone' => ['nullable', 'string', 'max:50'],
            'type' => ['required', 'in:individu,komunitas,media'],
            'platform' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'in:draft,pending_review,active,suspended,terminated'],
            'notes' => ['nullable', 'string'],
            'bank_name' => ['nullable', 'string', 'max:255'],
            'bank_account_number' => ['nullable', 'string', 'max:255'],
            'bank_account_name' => ['nullable', 'string', 'max:255'],
        ]);

        $user = \App\Models\User::query()->findOrFail($data['user_id']);

        $affiliate = WisataAffiliate::create([
            ...$data,
            'name' => $user->name,
            'email' => $user->email,
        ]);

        WisataAffiliateAuditLog::create([
            'admin_id' => $request->user()?->id,
            'action' => 'affiliate_created',
            'subject_type' => WisataAffiliate::class,
            'subject_id' => $affiliate->id,
            'meta' => $data,
        ]);

        return back()->with('status', 'affiliate-created');
    }

    public function update(Request $request, WisataAffiliate $affiliate): RedirectResponse
    {
        $data = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'wisata_id' => ['required', 'integer', 'exists:mitra_wisata_onboardings,id'],
            'phone' => ['nullable', 'string', 'max:50'],
            'type' => ['required', 'in:individu,komunitas,media'],
            'platform' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'in:draft,pending_review,active,suspended,terminated'],
            'notes' => ['nullable', 'string'],
            'bank_name' => ['nullable', 'string', 'max:255'],
            'bank_account_number' => ['nullable', 'string', 'max:255'],
            'bank_account_name' => ['nullable', 'string', 'max:255'],
        ]);

        $user = \App\Models\User::query()->findOrFail($data['user_id']);

        $affiliate->update([
            ...$data,
            'name' => $user->name,
            'email' => $user->email,
        ]);

        WisataAffiliateAuditLog::create([
            'admin_id' => $request->user()?->id,
            'action' => 'affiliate_updated',
            'subject_type' => WisataAffiliate::class,
            'subject_id' => $affiliate->id,
            'meta' => $data,
        ]);

        return back()->with('status', 'affiliate-updated');
    }

    public function updateStatus(Request $request, WisataAffiliate $affiliate): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:draft,pending_review,active,suspended,terminated'],
            'notes' => ['nullable', 'string'],
        ]);

        $affiliate->update([
            'status' => $data['status'],
            'notes' => $data['notes'] ?? $affiliate->notes,
        ]);

        WisataAffiliateAuditLog::create([
            'admin_id' => $request->user()?->id,
            'action' => 'affiliate_status_updated',
            'subject_type' => WisataAffiliate::class,
            'subject_id' => $affiliate->id,
            'meta' => $data,
        ]);

        return back()->with('status', 'affiliate-status-updated');
    }
}
