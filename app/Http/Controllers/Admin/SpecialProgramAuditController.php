<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EventAuditLog;
use Inertia\Inertia;
use Inertia\Response;

class SpecialProgramAuditController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/special-programs/system/audit', [
            'logs' => EventAuditLog::query()->latest()->paginate(30),
        ]);
    }
}
