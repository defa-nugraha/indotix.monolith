<?php

namespace App\Http\Controllers\Mitra\Wisata;

use App\Http\Controllers\Controller;
use App\Models\MitraWisataOnboarding;
use App\Models\WisataTicket;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
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
                'min_order_quantity' => max(1, (int) ($ticket->min_order_quantity ?? 1)),
                'max_order_quantity' => $ticket->max_order_quantity,
                'ticket_type' => $ticket->ticket_type,
                'ticket_kind' => $ticket->ticket_kind ?? 'single',
                'is_entry_ticket' => (bool) ($ticket->is_entry_ticket ?? true),
                'package_items' => $ticket->package_items ?? [],
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
                'min_order_quantity' => max(1, (int) ($ticket->min_order_quantity ?? 1)),
                'max_order_quantity' => $ticket->max_order_quantity,
                'ticket_type' => $ticket->ticket_type,
                'ticket_kind' => $ticket->ticket_kind ?? 'single',
                'package_items' => $ticket->package_items ?? [],
                'valid_from' => $ticket->valid_from?->toDateString(),
                'valid_until' => $ticket->valid_until?->toDateString(),
                'refund_policy' => $ticket->refund_policy,
                'is_active' => $ticket->is_active,
                'is_closed' => $ticket->is_closed,
            ] : null,
            'componentTickets' => WisataTicket::query()
                ->where('mitra_wisata_onboarding_id', $destination->id)
                ->where('ticket_kind', 'single')
                ->when($ticketId, fn ($query) => $query->where('id', '!=', $ticketId))
                ->orderBy('name')
                ->get(['id', 'name', 'price'])
                ->map(fn (WisataTicket $row) => [
                    'id' => $row->id,
                    'name' => $row->name,
                    'price' => $row->price,
                ])
                ->all(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $destination = $this->ownedDestination($request);
        $this->ensureSubmittedDestination($request, (int) $destination->id);

        $data = $request->validate([
            'mitra_wisata_onboarding_id' => ['nullable', 'integer'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'integer', 'min:0'],
            'quota' => ['required', 'integer', 'min:0'],
            'daily_quota' => ['nullable', 'integer', 'min:0'],
            'min_order_quantity' => ['nullable', 'integer', 'min:1', 'max:20'],
            'max_order_quantity' => ['nullable', 'integer', 'min:1', 'max:20', 'gte:min_order_quantity'],
            'ticket_type' => ['required', 'in:perorangan,grup'],
            'ticket_kind' => ['nullable', 'in:single,package'],
            'is_entry_ticket' => ['nullable', 'boolean'],
            'package_items' => ['nullable', 'array'],
            'package_items.*.ticket_id' => ['required_with:package_items', 'integer'],
            'package_items.*.quantity' => ['required_with:package_items', 'integer', 'min:1', 'max:20'],
            'valid_from' => ['nullable', 'date'],
            'valid_until' => ['nullable', 'date'],
            'refund_policy' => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
            'is_closed' => ['nullable', 'boolean'],
        ]);

        $ticketKind = $data['ticket_kind'] ?? 'single';
        $packageItems = $this->normalizePackageItems(
            $ticketKind,
            (int) $destination->id,
            $data['package_items'] ?? []
        );

        WisataTicket::create([
            'mitra_wisata_onboarding_id' => $destination->id,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'price' => $data['price'],
            'quota' => $data['quota'],
            'daily_quota' => $data['daily_quota'] ?? null,
            'min_order_quantity' => $data['min_order_quantity'] ?? 1,
            'max_order_quantity' => $data['max_order_quantity'] ?? null,
            'ticket_type' => $data['ticket_type'],
            'ticket_kind' => $ticketKind,
            'is_entry_ticket' => $request->has('is_entry_ticket') ? $request->boolean('is_entry_ticket') : true,
            'package_items' => $packageItems,
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
        $destination = $this->ownedDestination($request);
        $this->ensureSubmittedDestination($request, (int) $destination->id);

        if ((int) $ticket->mitra_wisata_onboarding_id !== (int) $destination->id) {
            abort(403);
        }

        $data = $request->validate([
            'mitra_wisata_onboarding_id' => ['nullable', 'integer'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'integer', 'min:0'],
            'quota' => ['required', 'integer', 'min:0'],
            'daily_quota' => ['nullable', 'integer', 'min:0'],
            'min_order_quantity' => ['nullable', 'integer', 'min:1', 'max:20'],
            'max_order_quantity' => ['nullable', 'integer', 'min:1', 'max:20', 'gte:min_order_quantity'],
            'ticket_type' => ['required', 'in:perorangan,grup'],
            'ticket_kind' => ['nullable', 'in:single,package'],
            'is_entry_ticket' => ['nullable', 'boolean'],
            'package_items' => ['nullable', 'array'],
            'package_items.*.ticket_id' => ['required_with:package_items', 'integer'],
            'package_items.*.quantity' => ['required_with:package_items', 'integer', 'min:1', 'max:20'],
            'valid_from' => ['nullable', 'date'],
            'valid_until' => ['nullable', 'date'],
            'refund_policy' => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
            'is_closed' => ['nullable', 'boolean'],
        ]);

        $ticketKind = $data['ticket_kind'] ?? 'single';
        $packageItems = $this->normalizePackageItems(
            $ticketKind,
            (int) $destination->id,
            $data['package_items'] ?? [],
            $ticket->id
        );

        $ticket->update([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'price' => $data['price'],
            'quota' => $data['quota'],
            'daily_quota' => $data['daily_quota'] ?? null,
            'min_order_quantity' => $data['min_order_quantity'] ?? 1,
            'max_order_quantity' => $data['max_order_quantity'] ?? null,
            'ticket_type' => $data['ticket_type'],
            'ticket_kind' => $ticketKind,
            'is_entry_ticket' => $request->has('is_entry_ticket') ? $request->boolean('is_entry_ticket') : (bool) ($ticket->is_entry_ticket ?? true),
            'package_items' => $packageItems,
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

        if ((int) $ticket->mitra_wisata_onboarding_id !== (int) $destination->id) {
            abort(403);
        }

        $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $ticket->delete();

        return back()->with('status', 'ticket-deleted');
    }

    private function ownedDestination(Request $request): MitraWisataOnboarding
    {
        $destination = MitraWisataOnboarding::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if ($destination->is_suspended) {
            throw ValidationException::withMessages([
                'mitra_wisata_onboarding_id' => 'Destinasi sedang disuspend oleh admin. Mitra tidak dapat mengubah produk.',
            ]);
        }

        return $destination;
    }

    private function ensureSubmittedDestination(Request $request, int $destinationId): void
    {
        if (! $request->filled('mitra_wisata_onboarding_id')) {
            return;
        }

        if ((int) $request->input('mitra_wisata_onboarding_id') === $destinationId) {
            return;
        }

        throw ValidationException::withMessages([
            'mitra_wisata_onboarding_id' => 'Tiket hanya bisa dibuat untuk destinasi milik akun mitra yang sedang login.',
        ]);
    }

    private function normalizePackageItems(string $ticketKind, int $destinationId, array $items, ?int $ignoreTicketId = null): ?array
    {
        if ($ticketKind !== 'package') {
            return null;
        }

        $normalized = collect($items)
            ->map(fn ($item) => [
                'ticket_id' => (int) ($item['ticket_id'] ?? 0),
                'quantity' => (int) ($item['quantity'] ?? 0),
            ])
            ->filter(fn ($item) => $item['ticket_id'] > 0 && $item['quantity'] > 0)
            ->groupBy('ticket_id')
            ->map(fn ($rows, $ticketId) => [
                'ticket_id' => (int) $ticketId,
                'quantity' => (int) collect($rows)->sum('quantity'),
            ])
            ->values();

        if ($normalized->isEmpty()) {
            throw ValidationException::withMessages([
                'package_items' => 'Paket wisata wajib berisi minimal satu tiket reguler.',
            ]);
        }

        $query = WisataTicket::query()
            ->where('mitra_wisata_onboarding_id', $destinationId)
            ->where('ticket_kind', 'single')
            ->whereIn('id', $normalized->pluck('ticket_id'));

        if ($ignoreTicketId) {
            $query->where('id', '!=', $ignoreTicketId);
        }

        $validTicketIds = $query
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();

        if ($normalized->pluck('ticket_id')->diff($validTicketIds)->isNotEmpty()) {
            throw ValidationException::withMessages([
                'package_items' => 'Paket hanya boleh berisi tiket reguler dari destinasi yang sama.',
            ]);
        }

        return $normalized->all();
    }
}
