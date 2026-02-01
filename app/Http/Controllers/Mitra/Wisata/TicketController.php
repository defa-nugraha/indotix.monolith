<?php

namespace App\Http\Controllers\Mitra\Wisata;

use App\Http\Controllers\Controller;
use App\Models\MitraWisataOnboarding;
use App\Models\WisataTicket;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TicketController extends Controller
{
    public function index(Request $request): Response
    {
        $destination = MitraWisataOnboarding::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $tickets = WisataTicket::query()
            ->where('mitra_wisata_onboarding_id', $destination->id)
            ->latest('id')
            ->get()
            ->map(fn (WisataTicket $ticket) => [
                'id' => $ticket->id,
                'name' => $ticket->name,
                'price' => $ticket->price,
                'quota' => $ticket->quota,
                'daily_quota' => $ticket->daily_quota,
                'ticket_type' => $ticket->ticket_type,
                'valid_from' => $ticket->valid_from?->toDateString(),
                'valid_until' => $ticket->valid_until?->toDateString(),
                'refund_policy' => $ticket->refund_policy,
                'is_active' => $ticket->is_active,
                'is_closed' => $ticket->is_closed,
            ]);

        return Inertia::render('mitra/wisata/tickets/index', [
            'destination' => [
                'id' => $destination->id,
                'destination_name' => $destination->destination_name,
            ],
            'tickets' => $tickets,
        ]);
    }

    public function create(Request $request): Response
    {
        $destination = MitraWisataOnboarding::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $ticketId = $request->integer('edit') ?: null;
        $ticket = null;
        if ($ticketId) {
            $ticket = WisataTicket::query()
                ->where('mitra_wisata_onboarding_id', $destination->id)
                ->where('id', $ticketId)
                ->first();
        }

        return Inertia::render('mitra/wisata/tickets/create', [
            'destination' => [
                'id' => $destination->id,
                'destination_name' => $destination->destination_name,
            ],
            'ticket' => $ticket ? [
                'id' => $ticket->id,
                'name' => $ticket->name,
                'description' => $ticket->description,
                'price' => $ticket->price,
                'quota' => $ticket->quota,
                'daily_quota' => $ticket->daily_quota,
                'ticket_type' => $ticket->ticket_type,
                'valid_from' => $ticket->valid_from?->toDateString(),
                'valid_until' => $ticket->valid_until?->toDateString(),
                'refund_policy' => $ticket->refund_policy,
                'is_active' => $ticket->is_active,
                'is_closed' => $ticket->is_closed,
            ] : null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $destination = MitraWisataOnboarding::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'integer', 'min:0'],
            'quota' => ['required', 'integer', 'min:0'],
            'daily_quota' => ['nullable', 'integer', 'min:0'],
            'ticket_type' => ['required', 'in:perorangan,grup'],
            'valid_from' => ['nullable', 'date'],
            'valid_until' => ['nullable', 'date'],
            'refund_policy' => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
            'is_closed' => ['nullable', 'boolean'],
        ]);

        WisataTicket::create([
            'mitra_wisata_onboarding_id' => $destination->id,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'price' => $data['price'],
            'quota' => $data['quota'],
            'daily_quota' => $data['daily_quota'] ?? null,
            'ticket_type' => $data['ticket_type'],
            'valid_from' => $data['valid_from'] ?? null,
            'valid_until' => $data['valid_until'] ?? null,
            'refund_policy' => $data['refund_policy'] ?? null,
            'is_active' => (bool) ($data['is_active'] ?? false),
            'is_closed' => (bool) ($data['is_closed'] ?? false),
        ]);

        return redirect()->route('mitra.wisata.tickets.index')->with('status', 'ticket-created');
    }

    public function update(Request $request, WisataTicket $ticket): RedirectResponse
    {
        $destination = MitraWisataOnboarding::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if ($ticket->mitra_wisata_onboarding_id !== $destination->id) {
            abort(403);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'integer', 'min:0'],
            'quota' => ['required', 'integer', 'min:0'],
            'daily_quota' => ['nullable', 'integer', 'min:0'],
            'ticket_type' => ['required', 'in:perorangan,grup'],
            'valid_from' => ['nullable', 'date'],
            'valid_until' => ['nullable', 'date'],
            'refund_policy' => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
            'is_closed' => ['nullable', 'boolean'],
        ]);

        $ticket->update([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'price' => $data['price'],
            'quota' => $data['quota'],
            'daily_quota' => $data['daily_quota'] ?? null,
            'ticket_type' => $data['ticket_type'],
            'valid_from' => $data['valid_from'] ?? null,
            'valid_until' => $data['valid_until'] ?? null,
            'refund_policy' => $data['refund_policy'] ?? null,
            'is_active' => (bool) ($data['is_active'] ?? false),
            'is_closed' => (bool) ($data['is_closed'] ?? false),
        ]);

        return back()->with('status', 'ticket-updated');
    }

    public function destroy(Request $request, WisataTicket $ticket): RedirectResponse
    {
        $destination = MitraWisataOnboarding::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if ($ticket->mitra_wisata_onboarding_id !== $destination->id) {
            abort(403);
        }

        $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $ticket->delete();

        return back()->with('status', 'ticket-deleted');
    }
}
