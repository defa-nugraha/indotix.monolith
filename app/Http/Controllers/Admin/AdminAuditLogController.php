<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAuditLog;
use App\Models\User;
use App\Models\UserActivityLog;
use App\Support\PaginationOptions;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminAuditLogController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'admin_id' => ['nullable', 'integer', 'exists:users,id'],
            'source' => ['nullable', 'string', 'in:admin,user'],
            'role' => ['nullable', 'string', 'max:64'],
            'method' => ['nullable', 'string', 'in:POST,PUT,PATCH,DELETE'],
            'path' => ['nullable', 'string', 'max:120'],
            'ip_address' => ['nullable', 'string', 'max:64'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'per_page' => ['nullable', 'integer', 'in:25,50,100'],
        ]);

        $adminQuery = AdminAuditLog::query()->with('admin');
        $userQuery = UserActivityLog::query()->with('user');

        if (! empty($filters['search'])) {
            $search = trim($filters['search']);
            $adminQuery->where(function ($builder) use ($search) {
                $builder
                    ->where('action', 'like', "%{$search}%")
                    ->orWhere('method', 'like', "%{$search}%")
                    ->orWhere('path', 'like', "%{$search}%")
                    ->orWhere('ip_address', 'like', "%{$search}%")
                    ->orWhereHas('admin', function ($adminQuery) use ($search) {
                        $adminQuery
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
            $userQuery->where(function ($builder) use ($search) {
                $builder
                    ->where('action', 'like', "%{$search}%")
                    ->orWhere('method', 'like', "%{$search}%")
                    ->orWhere('path', 'like', "%{$search}%")
                    ->orWhere('ip_address', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($userSearchQuery) use ($search) {
                        $userSearchQuery
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        if (! empty($filters['admin_id'])) {
            $adminQuery->where('admin_id', (int) $filters['admin_id']);
            $userQuery->where('user_id', (int) $filters['admin_id']);
        }

        if (! empty($filters['role'])) {
            $adminQuery->whereHas('admin', fn ($builder) => $builder->where('role', $filters['role']));
            $userQuery->where('role', $filters['role']);
        }

        if (! empty($filters['method'])) {
            $adminQuery->where('method', $filters['method']);
            $userQuery->where('method', $filters['method']);
        }

        if (! empty($filters['path'])) {
            $adminQuery->where('path', 'like', '%'.trim($filters['path']).'%');
            $userQuery->where('path', 'like', '%'.trim($filters['path']).'%');
        }

        if (! empty($filters['ip_address'])) {
            $adminQuery->where('ip_address', 'like', '%'.trim($filters['ip_address']).'%');
            $userQuery->where('ip_address', 'like', '%'.trim($filters['ip_address']).'%');
        }

        if (! empty($filters['date_from'])) {
            $adminQuery->whereDate('created_at', '>=', $filters['date_from']);
            $userQuery->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $adminQuery->whereDate('created_at', '<=', $filters['date_to']);
            $userQuery->whereDate('created_at', '<=', $filters['date_to']);
        }

        $rows = collect();
        if (($filters['source'] ?? null) !== 'user') {
            $rows = $rows->merge($adminQuery->latest('id')->get()->map(fn (AdminAuditLog $log) => [
                'source' => 'admin',
                'source_label' => 'Admin',
                'id' => $log->id,
                'actor_name' => $log->admin?->name,
                'actor_email' => $log->admin?->email,
                'actor_role' => $log->admin?->role,
                'action' => $log->action,
                'method' => $log->method,
                'path' => $log->path,
                'ip_address' => $log->ip_address,
                'user_agent' => $log->user_agent,
                'payload' => $log->payload,
                'created_at' => $log->created_at?->toDateTimeString(),
                'created_at_sort' => $log->created_at?->timestamp ?? 0,
            ]));
        }
        if (($filters['source'] ?? null) !== 'admin') {
            $rows = $rows->merge($userQuery->latest('id')->get()->map(fn (UserActivityLog $log) => [
                'source' => 'user',
                'source_label' => 'User/Mitra',
                'id' => $log->id,
                'actor_name' => $log->user?->name,
                'actor_email' => $log->user?->email,
                'actor_role' => $log->role ?? $log->user?->role,
                'action' => $log->action,
                'method' => $log->method,
                'path' => $log->path,
                'ip_address' => $log->ip_address,
                'user_agent' => $log->user_agent,
                'payload' => $log->payload,
                'created_at' => $log->created_at?->toDateTimeString(),
                'created_at_sort' => $log->created_at?->timestamp ?? 0,
            ]));
        }

        $rows = $rows->sortByDesc('created_at_sort')->values()->map(function (array $row) {
            unset($row['created_at_sort']);

            return $row;
        });
        $perPage = PaginationOptions::perPage($request);
        $page = LengthAwarePaginator::resolveCurrentPage();
        $logs = new LengthAwarePaginator(
            $rows->forPage($page, $perPage)->values(),
            $rows->count(),
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        $actorOptions = User::query()
            ->select('id', 'name', 'email', 'role')
            ->orderBy('name')
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'label' => $user->name.' ('.$user->email.' - '.$user->role.')',
            ])
            ->all();

        $roleOptions = User::query()->whereNotNull('role')->distinct()->orderBy('role')->pluck('role')->values()->all();
        $methodStats = collect(AdminAuditLog::query()->selectRaw('method, COUNT(*) as total')->groupBy('method')->pluck('total', 'method')->all())
            ->mergeRecursive(UserActivityLog::query()->selectRaw('method, COUNT(*) as total')->groupBy('method')->pluck('total', 'method')->all())
            ->map(fn ($value) => is_array($value) ? array_sum($value) : $value)
            ->all();

        return Inertia::render('admin/system/audit-logs/index', [
            'logs' => $logs,
            'filters' => $request->only([
                'search',
                'admin_id',
                'source',
                'role',
                'method',
                'path',
                'ip_address',
                'date_from',
                'date_to',
                'per_page',
            ]),
            'actorOptions' => $actorOptions,
            'roleOptions' => $roleOptions,
            'methodOptions' => ['POST', 'PUT', 'PATCH', 'DELETE'],
            'summary' => [
                'total' => AdminAuditLog::query()->count() + UserActivityLog::query()->count(),
                'today' => AdminAuditLog::query()->whereDate('created_at', today())->count() + UserActivityLog::query()->whereDate('created_at', today())->count(),
                'unique_actors' => AdminAuditLog::query()->distinct('admin_id')->count('admin_id') + UserActivityLog::query()->distinct('user_id')->count('user_id'),
                'user_logs' => UserActivityLog::query()->count(),
                'methods' => $methodStats,
            ],
        ]);
    }
}
