<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\WisataTicket;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WisataTicketController extends Controller
{
    public function index(Request $request): Response
    {
        $query = WisataTicket::query()
            ->with(['destination.user:id,name,email']);

        if ($search = $request->string('search')->toString()) {
            $query->where('name', 'like', "%{$search}%")
                ->orWhereHas('destination', fn ($builder) => $builder->where('destination_name', 'like', "%{$search}%"))
                ->orWhereHas('destination.user', fn ($builder) => $builder->where('name', 'like', "%{$search}%"));
        }

        if ($status = $request->string('status')->toString()) {
            $query->where('is_active', $status === 'active');
        }

        $tickets = $query->latest('id')
            ->paginate(10)
            ->withQueryString()
            ->through(function (WisataTicket $ticket) {
                return [
                    'id' => $ticket->id,
                    'name' => $ticket->name,
                    'price' => $ticket->price,
                    'quota' => $ticket->quota,
                    'max_quota_override' => $ticket->max_quota_override,
                    'is_active' => $ticket->is_active,
                    'destination' => [
                        'id' => $ticket->destination?->id,
                        'destination_name' => $ticket->destination?->destination_name,
                    ],
                    'owner' => [
                        'id' => $ticket->destination?->user?->id,
                        'name' => $ticket->destination?->user?->name,
                        'email' => $ticket->destination?->user?->email,
                    ],
                ];
            });

        return Inertia::render('admin/wisata/tickets/index', [
            'tickets' => $tickets,
            'filters' => [
                'search' => $request->string('search')->toString(),
                'status' => $request->string('status')->toString(),
            ],
        ]);
    }

    public function create(): Response
    {
        $destinations = \App\Models\MitraWisataOnboarding::query()
            ->where('verification_status', 'verified')
            ->where('is_suspended', false)
            ->orderBy('destination_name')
            ->get(['id', 'destination_name'])
            ->map(fn ($item) => [
                'id' => $item->id,
                'label' => $item->destination_name ?? 'Destinasi #' . $item->id,
            ])
            ->all();

        return Inertia::render('admin/wisata/tickets/create', [
            'destinations' => $destinations,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'mitra_wisata_onboarding_id' => ['required', 'exists:mitra_wisata_onboardings,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'integer', 'min:0'],
            'quota' => ['required', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        WisataTicket::create($data);

        return redirect()->route('admin.wisata.tickets.index')->with('status', 'ticket-created');
    }

    public function update(Request $request, WisataTicket $ticket): RedirectResponse
    {
        $data = $request->validate([
            'is_active' => ['nullable', 'boolean'],
            'max_quota_override' => ['nullable', 'integer', 'min:0'],
        ]);

        $ticket->update($data);

        return back()->with('status', 'ticket-updated');
    }

    public function destroy(Request $request, WisataTicket $ticket): RedirectResponse
    {
        $data = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $ticket->delete();

        return back()->with('status', 'ticket-deleted');
    }
}
