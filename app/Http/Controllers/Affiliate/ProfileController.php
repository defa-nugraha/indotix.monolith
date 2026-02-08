<?php

namespace App\Http\Controllers\Affiliate;

use App\Http\Controllers\Controller;
use App\Models\WisataAffiliate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function show(Request $request): Response
    {
        $affiliate = WisataAffiliate::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        return Inertia::render('affiliate/profile', [
            'affiliate' => $affiliate,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $affiliate = WisataAffiliate::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $data = $request->validate([
            'phone' => ['required', 'string', 'max:30'],
            'platform' => ['nullable', 'string', 'max:255'],
            'bank_name' => ['nullable', 'string', 'max:100'],
            'bank_account_number' => ['nullable', 'string', 'max:100'],
            'bank_account_name' => ['nullable', 'string', 'max:100'],
        ]);

        $affiliate->update($data);

        return back()->with('status', 'affiliate-updated');
    }
}
