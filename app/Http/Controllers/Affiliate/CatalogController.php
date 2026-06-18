<?php

namespace App\Http\Controllers\Affiliate;

use App\Http\Controllers\Controller;
use App\Models\MitraWisataOnboarding;
use App\Models\WisataAffiliate;
use App\Models\WisataAffiliateCommission;
use App\Models\WisataTicket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Inertia\Inertia;
use Inertia\Response;

class CatalogController extends Controller
{
    public function index(Request $request): Response
    {
        $affiliate = WisataAffiliate::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $destination = null;
        $tickets = collect();
        $commission = null;

        if ($affiliate->wisata_id) {
            $destination = MitraWisataOnboarding::query()->publiclyVisible()->find($affiliate->wisata_id);
            if ($destination) {
                $tickets = WisataTicket::query()
                    ->where('mitra_wisata_onboarding_id', $destination->id)
                    ->where('is_active', true)
                    ->where('is_closed', false)
                    ->orderBy('name')
                    ->get()
                    ->map(fn (WisataTicket $ticket) => [
                        'id' => $ticket->id,
                        'name' => $ticket->name,
                        'price' => $ticket->price,
                        'ticket_type' => $ticket->ticket_type,
                    ]);

                $today = now()->toDateString();
                $commission = WisataAffiliateCommission::query()
                    ->where('scope_type', 'wisata')
                    ->where('wisata_id', $destination->id)
                    ->where(function ($query) use ($today) {
                        $query->whereNull('start_date')->orWhere('start_date', '<=', $today);
                    })
                    ->where(function ($query) use ($today) {
                        $query->whereNull('end_date')->orWhere('end_date', '>=', $today);
                    })
                    ->latest('id')
                    ->first()
                    ?: WisataAffiliateCommission::query()
                        ->where('scope_type', 'global')
                        ->where(function ($query) use ($today) {
                            $query->whereNull('start_date')->orWhere('start_date', '<=', $today);
                        })
                        ->where(function ($query) use ($today) {
                            $query->whereNull('end_date')->orWhere('end_date', '>=', $today);
                        })
                        ->latest('id')
                        ->first();
            }
        }

        return Inertia::render('affiliate/catalog', [
            'destination' => $destination ? [
                'id' => $destination->id,
                'encrypted_id' => Crypt::encryptString((string) $destination->id),
                'slug' => $destination->slug,
                'destination_name' => $destination->destination_name,
                'destination_type' => $destination->destination_type,
                'address_full' => $destination->address_full,
                'photo_area_url' => $destination->photo_area_path ? '/storage/'.$destination->photo_area_path : null,
            ] : null,
            'tickets' => $tickets,
            'commission' => $commission ? [
                'type' => $commission->type,
                'value' => $commission->value,
                'source' => $commission->source,
            ] : null,
        ]);
    }
}
