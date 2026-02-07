<?php

namespace App\Http\Controllers\Admin\WisataAffiliate;

use App\Http\Controllers\Controller;
use App\Models\WisataAffiliateAuditLog;
use Inertia\Inertia;
use Inertia\Response;

class AuditController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/wisata-affiliates/audit', [
            'logs' => WisataAffiliateAuditLog::query()->latest('id')->paginate(30)->withQueryString(),
        ]);
    }
}
