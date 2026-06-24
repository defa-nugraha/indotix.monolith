<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EventAuditLog;
use App\Support\AdminDataScope;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EventAuditController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('admin/events/system/audit', [
            'logs' => EventAuditLog::query()
                ->when(! AdminDataScope::canViewAll($request->user()), fn ($query) => $query
                    ->where('admin_id', $request->user()?->id ?? 0))
                ->latest()
                ->paginate(\App\Support\PaginationOptions::perPage()),
        ]);
    }
}
