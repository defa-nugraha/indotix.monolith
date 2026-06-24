<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SouvenirAuditLog;
use App\Support\AdminDataScope;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SouvenirAuditController extends Controller
{
    public function index(Request $request): Response
    {
        $logs = SouvenirAuditLog::query()
            ->with('user:id,name')
            ->when(! AdminDataScope::canViewAll($request->user()), fn ($query) => $query
                ->where('created_by', $request->user()?->id ?? 0))
            ->latest()
            ->paginate(\App\Support\PaginationOptions::perPage())
            ->withQueryString();

        return Inertia::render('admin/souvenir/audit/index', [
            'logs' => $logs,
        ]);
    }
}
