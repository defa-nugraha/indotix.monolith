<?php

namespace App\Http\Controllers\Mitra\Event;

use App\Http\Controllers\Controller;
use App\Models\MitraEventOnboarding;
use App\Models\MitraEventStaff;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StaffController extends Controller
{
    public function index(Request $request): Response
    {
        $onboarding = MitraEventOnboarding::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $staff = MitraEventStaff::query()
            ->where('mitra_event_onboarding_id', $onboarding->id)
            ->latest('id')
            ->get()
            ->map(fn (MitraEventStaff $item) => [
                'id' => $item->id,
                'name' => $item->name,
                'email' => $item->email,
                'role' => $item->role,
                'is_active' => $item->is_active,
            ]);

        return Inertia::render('mitra/events/staff/index', [
            'organizer' => [
                'id' => $onboarding->id,
                'name' => $onboarding->eo_name,
            ],
            'staff' => $staff,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $onboarding = MitraEventOnboarding::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'role' => ['required', 'in:owner,admin_event,staff_checkin'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        MitraEventStaff::create([
            'mitra_event_onboarding_id' => $onboarding->id,
            'name' => $data['name'],
            'email' => $data['email'] ?? null,
            'role' => $data['role'],
            'is_active' => (bool) ($data['is_active'] ?? true),
        ]);

        return back()->with('status', 'staff-created');
    }

    public function update(Request $request, MitraEventStaff $staff): RedirectResponse
    {
        $onboarding = MitraEventOnboarding::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if ($staff->mitra_event_onboarding_id !== $onboarding->id) {
            abort(403);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'role' => ['required', 'in:owner,admin_event,staff_checkin'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $staff->update([
            'name' => $data['name'],
            'email' => $data['email'] ?? null,
            'role' => $data['role'],
            'is_active' => (bool) ($data['is_active'] ?? $staff->is_active),
        ]);

        return back()->with('status', 'staff-updated');
    }

    public function destroy(Request $request, MitraEventStaff $staff): RedirectResponse
    {
        $onboarding = MitraEventOnboarding::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if ($staff->mitra_event_onboarding_id !== $onboarding->id) {
            abort(403);
        }

        $staff->delete();

        return back()->with('status', 'staff-deleted');
    }
}
