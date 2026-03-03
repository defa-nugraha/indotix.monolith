<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SpecialAdminController extends Controller
{
    public function index(Request $request): Response
    {
        $allowedRoles = $this->allowedRoles();

        $query = User::query()->whereIn('role', $allowedRoles);

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
        $admins = $paginator->through(function (User $user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role ?? 'user',
                'is_suspended' => (bool) $user->is_suspended,
                'email_verified_at' => optional($user->email_verified_at)->toDateTimeString(),
                'created_at' => optional($user->created_at)->toDateTimeString(),
            ];
        });

        return Inertia::render('admin/system/special-admins/index', [
            'admins' => $admins,
            'filters' => [
                'search' => $request->string('search')->toString(),
                'role' => $request->string('role')->toString(),
            ],
            'roleOptions' => $this->roleOptions(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $roles = $this->allowedRoles();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'max:255'],
            'role' => ['required', 'string', Rule::in($roles)],
        ]);

        User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => $data['role'],
            'email_verified_at' => now(),
            'remember_token' => Str::random(10),
        ]);

        return back()->with('status', 'admin-created');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $roles = $this->allowedRoles();

        if (! in_array($user->role, $roles, true)) {
            abort(404);
        }

        $data = $request->validate([
            'role' => ['required', 'string', Rule::in($roles)],
        ]);

        $user->update([
            'role' => $data['role'],
        ]);

        return back()->with('status', 'admin-updated');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        $roles = $this->allowedRoles();

        if (! in_array($user->role, $roles, true)) {
            abort(404);
        }

        if ($request->user()?->id === $user->id) {
            return back()->withErrors([
                'delete' => 'Tidak bisa menghapus akun sendiri.',
            ]);
        }

        $user->delete();

        return back()->with('status', 'admin-deleted');
    }

    private function allowedRoles(): array
    {
        return [
            'admin_academy',
            'admin_retail',
            'admin_special_program',
        ];
    }

    private function roleOptions(): array
    {
        return [
            ['value' => 'admin_academy', 'label' => 'Admin Academy'],
            ['value' => 'admin_retail', 'label' => 'Admin Retail Shop'],
            ['value' => 'admin_special_program', 'label' => 'Admin Special Program'],
        ];
    }
}
