<?php

namespace App\Http\Controllers\Affiliate;

use App\Http\Controllers\Controller;
use App\Models\MitraWisataOnboarding;
use App\Models\WisataAffiliate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class RegisterController extends Controller
{
    public function create(Request $request): Response|RedirectResponse
    {
        $existing = WisataAffiliate::query()->where('user_id', $request->user()->id)->first();
        if ($existing) {
            return redirect()->route('affiliate.dashboard');
        }

        $destinations = MitraWisataOnboarding::query()
            ->publiclyVisible()
            ->orderBy('destination_name')
            ->get()
            ->map(function (MitraWisataOnboarding $destination) {
                return [
                    'id' => $destination->id,
                    'destination_name' => $destination->destination_name,
                    'city_name' => $destination->city_code
                        ? DB::table('regencies')->where('code', $destination->city_code)->value('name')
                        : null,
                ];
            });

        return Inertia::render('affiliate/register', [
            'destinations' => $destinations,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $existing = WisataAffiliate::query()->where('user_id', $request->user()->id)->first();
        if ($existing) {
            return redirect()->route('affiliate.dashboard');
        }

        $data = $request->validate([
            'wisata_id' => ['required', 'integer', 'exists:mitra_wisata_onboardings,id'],
            'phone' => ['required', 'string', 'max:30'],
            'type' => ['required', 'in:individu,komunitas,media'],
            'platform' => ['nullable', 'string', 'max:255'],
            'bank_name' => ['nullable', 'string', 'max:100'],
            'bank_account_number' => ['nullable', 'string', 'max:100'],
            'bank_account_name' => ['nullable', 'string', 'max:100'],
        ]);

        $destination = MitraWisataOnboarding::query()
            ->publiclyVisible()
            ->where('id', $data['wisata_id'])
            ->firstOrFail();

        WisataAffiliate::create([
            'user_id' => $request->user()->id,
            'wisata_id' => $destination->id,
            'name' => $request->user()->name ?? 'Affiliate',
            'email' => $request->user()->email,
            'phone' => $data['phone'],
            'type' => $data['type'],
            'platform' => $data['platform'] ?? null,
            'status' => 'pending_review',
            'bank_name' => $data['bank_name'] ?? null,
            'bank_account_number' => $data['bank_account_number'] ?? null,
            'bank_account_name' => $data['bank_account_name'] ?? null,
        ]);

        return redirect()->route('affiliate.dashboard')->with('status', 'affiliate-registered');
    }
}
