<?php

namespace App\Http\Controllers\Mitra\Wisata;

use App\Http\Controllers\Controller;
use App\Models\MitraWisataOnboarding;
use App\Models\MitraWisataStaff;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class StaffController extends Controller
{
    public function index(Request $request): Response
    {
        $destination = MitraWisataOnboarding::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $staff = MitraWisataStaff::query()
            ->where('mitra_wisata_onboarding_id', $destination->id)
            ->orderBy('name')
            ->get()
            ->map(fn (MitraWisataStaff $item) => [
                'id' => $item->id,
                'name' => $item->name,
                'email' => $item->email,
                'role' => $item->role,
                'is_active' => $item->is_active,
            ]);

        return Inertia::render('mitra/wisata/staff/index', [
            'destination' => [
                'id' => $destination->id,
                'destination_name' => $destination->destination_name,
            ],
            'staff' => $staff,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $destination = MitraWisataOnboarding::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('mitra_wisata_staff', 'email')
                    ->where('mitra_wisata_onboarding_id', $destination->id),
            ],
            'role' => ['required', 'in:owner,admin_mitra,staff_validasi'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $destination->staff()->create([
            'name' => $data['name'],
            'email' => $data['email'] ?? null,
            'role' => $data['role'],
            'is_active' => (bool) ($data['is_active'] ?? true),
        ]);

        return back()->with('status', 'staff-created');
    }

    public function update(Request $request, MitraWisataStaff $staff): RedirectResponse
    {
        $destination = MitraWisataOnboarding::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if ($staff->mitra_wisata_onboarding_id !== $destination->id) {
            abort(403);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('mitra_wisata_staff', 'email')
                    ->where('mitra_wisata_onboarding_id', $destination->id)
                    ->ignore($staff->id),
            ],
            'role' => ['required', 'in:owner,admin_mitra,staff_validasi'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $staff->update([
            'name' => $data['name'],
            'email' => $data['email'] ?? null,
            'role' => $data['role'],
            'is_active' => (bool) ($data['is_active'] ?? false),
        ]);

        return back()->with('status', 'staff-updated');
    }

    public function destroy(Request $request, MitraWisataStaff $staff): RedirectResponse
    {
        $destination = MitraWisataOnboarding::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if ($staff->mitra_wisata_onboarding_id !== $destination->id) {
            abort(403);
        }

        $staff->delete();

        return back()->with('status', 'staff-deleted');
    }
}
