<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SouvenirAuditLog;
use Inertia\Inertia;
use Inertia\Response;

class SouvenirAuditController extends Controller
{
    public function index(): Response
    {
        $logs = SouvenirAuditLog::query()
            ->with('user:id,name')
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/souvenir/audit/index', [
            'logs' => $logs,
        ]);
    }
}
