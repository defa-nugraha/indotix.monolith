<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        $provinces = DB::table('provinces')
            ->orderBy('name')
            ->get(['code', 'name'])
            ->map(fn ($item) => ['value' => $item->code, 'label' => $item->name])
            ->all();

        $cities = DB::table('regencies')
            ->join('provinces', 'regencies.province_code', '=', 'provinces.code')
            ->orderBy('regencies.name')
            ->get([
                'regencies.code as code',
                'regencies.name as name',
                'regencies.province_code as province_code',
            ])
            ->map(fn ($item) => [
                'value' => $item->code,
                'label' => $item->name,
                'province_code' => $item->province_code,
            ])
            ->all();

        $districts = DB::table('districts')
            ->join('regencies', 'districts.regency_code', '=', 'regencies.code')
            ->join('provinces', 'regencies.province_code', '=', 'provinces.code')
            ->orderBy('districts.name')
            ->get([
                'districts.code as code',
                'districts.name as name',
                'districts.regency_code as city_code',
                'regencies.province_code as province_code',
            ])
            ->map(fn ($item) => [
                'value' => $item->code,
                'label' => $item->name,
                'city_code' => $item->city_code,
                'province_code' => $item->province_code,
            ])
            ->all();

        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
            'provinces' => $provinces,
            'cities' => $cities,
            'districts' => $districts,
            'addresses' => $request->user()
                ? $request->user()
                    ->addresses()
                    ->orderByDesc('is_default')
                    ->orderByDesc('updated_at')
                    ->get()
                : [],
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return to_route('profile.edit');
    }

    /**
     * Delete the user's profile.
     */
    public function destroy(ProfileDeleteRequest $request): RedirectResponse
    {
        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
