<?php

namespace App\Http\Controllers\Admin\WisataAffiliate;

use App\Http\Controllers\Controller;
use App\Models\WisataAffiliateCommissionItem;
use Inertia\Inertia;
use Inertia\Response;

class CommissionLogController extends Controller
{
    public function index(): Response
    {
        $items = WisataAffiliateCommissionItem::query()
            ->with('affiliate')
            ->latest('id')
            ->paginate(\App\Support\PaginationOptions::perPage())
            ->withQueryString();

        return Inertia::render('admin/wisata-affiliates/commissions-log', [
            'items' => $items,
        ]);
    }
}
