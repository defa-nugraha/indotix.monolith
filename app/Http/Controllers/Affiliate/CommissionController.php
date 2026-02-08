<?php

namespace App\Http\Controllers\Affiliate;

use App\Http\Controllers\Controller;
use App\Models\WisataAffiliate;
use App\Models\WisataAffiliateCommissionItem;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CommissionController extends Controller
{
    public function index(Request $request): Response
    {
        $affiliate = WisataAffiliate::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $status = $request->query('status');

        $items = WisataAffiliateCommissionItem::query()
            ->where('affiliate_id', $affiliate->id)
            ->when($status, fn ($query) => $query->where('status', $status))
            ->with(['booking.ticket', 'booking.destination'])
            ->latest('id')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('affiliate/commissions', [
            'items' => $items,
            'filters' => [
                'status' => $status,
            ],
        ]);
    }
}
