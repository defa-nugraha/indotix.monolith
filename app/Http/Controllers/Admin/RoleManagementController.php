<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RoleManagementController extends Controller
{
    public function index(Request $request): Response
    {
        $query = User::query();

        if ($request->filled('search')) {
            $term = '%'.$request->string('search')->toString().'%';
            $query->where(function ($builder) use ($term) {
                $builder->where('name', 'like', $term)
                    ->orWhere('email', 'like', $term);
            });
        }

        if ($request->filled('role')) {
            $query->where('role', $request->string('role')->toString());
        }

        $paginator = $query->latest('id')->paginate(12)->withQueryString();
        $users = $paginator->through(function (User $user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role ?? 'user',
                'mitra_onboarding_type' => $user->mitra_onboarding_type,
                'is_suspended' => (bool) $user->is_suspended,
                'email_verified_at' => optional($user->email_verified_at)->toDateTimeString(),
                'created_at' => optional($user->created_at)->toDateTimeString(),
            ];
        });

        return Inertia::render('admin/system/roles/index', [
            'users' => $users,
            'filters' => [
                'search' => $request->string('search')->toString(),
                'role' => $request->string('role')->toString(),
            ],
            'roleOptions' => $this->roleOptions(),
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $roles = collect($this->roleOptions())->pluck('value')->all();

        $data = $request->validate([
            'role' => ['required', 'string', Rule::in($roles)],
        ]);

        if ($request->user()?->id === $user->id && $data['role'] !== 'admin') {
            return back()->withErrors([
                'role' => 'Role admin utama tidak boleh diubah pada akun sendiri.',
            ]);
        }

        $user->update([
            'role' => $data['role'],
        ]);

        return back()->with('status', 'role-updated');
    }

    private function roleOptions(): array
    {
        return [
            ['value' => 'user', 'label' => 'User'],
            ['value' => 'mitra', 'label' => 'Mitra'],
            ['value' => 'admin', 'label' => 'Admin Utama'],
            ['value' => 'admin_academy', 'label' => 'Admin Academy'],
            ['value' => 'admin_retail', 'label' => 'Admin Retail Shop'],
            ['value' => 'admin_special_program', 'label' => 'Admin Special Program'],
        ];
    }
}
