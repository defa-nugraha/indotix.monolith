<?php

namespace App\Http\Controllers\Mitra;

use App\Http\Controllers\Controller;
use App\Models\MitraOnboarding;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BankAccountController extends Controller
{
    public function edit(Request $request): Response
    {
        $user = $request->user();
        $onboarding = MitraOnboarding::query()->firstOrCreate([
            'user_id' => $user->id,
        ]);

        return Inertia::render('mitra/finance/bank', [
            'bank' => [
                'bank_name' => $onboarding->bank_name,
                'bank_account_number' => $onboarding->bank_account_number,
                'bank_account_name' => $onboarding->bank_account_name,
            ],
            'payout_status' => $onboarding->payout_status,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();
        $onboarding = MitraOnboarding::query()->firstOrCreate([
            'user_id' => $user->id,
        ]);

        $data = $request->validate([
            'bank_name' => ['required', 'string', 'max:255'],
            'bank_account_number' => ['required', 'string', 'max:64'],
            'bank_account_name' => ['required', 'string', 'max:255'],
        ]);

        $onboarding->update($data);

        return back()->with('status', 'bank-updated');
    }
}
