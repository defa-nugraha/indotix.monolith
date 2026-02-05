<?php

namespace App\Http\Controllers\Admin\Academy;

use App\Http\Controllers\Controller;
use App\Models\AcademyAuditLog;
use Inertia\Inertia;
use Inertia\Response;

class AuditController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/academy/audit/index', [
            'logs' => AcademyAuditLog::query()->latest('id')->paginate(30),
        ]);
    }
}
