<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminAuditLogController extends Controller
{
    public function index(Request $request): Response
    {
        $query = AdminAuditLog::query()->with('admin')->latest();

        if ($request->filled('admin_id')) {
            $query->where('admin_id', (int) $request->input('admin_id'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }

        $logs = $query
            ->paginate(15)
            ->withQueryString()
            ->through(fn (AdminAuditLog $log) => [
                'id' => $log->id,
                'admin_name' => $log->admin?->name,
                'action' => $log->action,
                'method' => $log->method,
                'path' => $log->path,
                'ip_address' => $log->ip_address,
                'created_at' => $log->created_at?->toDateTimeString(),
            ]);

        $adminOptions = User::query()
            ->where('role', 'admin')
            ->select('id', 'name', 'email')
            ->orderBy('name')
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'label' => $user->name.' ('.$user->email.')',
            ])
            ->all();

        return Inertia::render('admin/system/audit-logs/index', [
            'logs' => $logs,
            'filters' => $request->only(['admin_id', 'date_from', 'date_to']),
            'adminOptions' => $adminOptions,
        ]);
    }
}
