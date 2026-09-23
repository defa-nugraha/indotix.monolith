<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MitraWisataOnboarding;
use App\Models\WisataTicket;
use App\Support\AdminDataScope;
use App\Support\PaginationOptions;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class WisataTicketController extends Controller
{
    public function index(Request $request): Response
    {
        $destinationId = $request->integer('destination_id');
        $search = $request->string('search')->toString();
        $status = $request->string('status')->toString();

        if (! $destinationId) {
            $destinations = AdminDataScope::applyCreatedByOrUser(
                MitraWisataOnboarding::query()
                    ->with(['user:id,name,email'])
                    ->withCount([
                        'tickets',
                        'tickets as active_tickets_count' => fn ($query) => $query->where('is_active', true),
                        'tickets as inactive_tickets_count' => fn ($query) => $query->where('is_active', false),
                    ]),
                $request,
            )
                ->when($search, function ($query) use ($search) {
                    $query->where(function ($builder) use ($search) {
                        $builder->where('destination_name', 'like', "%{$search}%")
                            ->orWhereHas('user', fn ($user) => $user
                                ->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%"));
                    });
                })
                ->orderBy('destination_name')
                ->paginate(PaginationOptions::perPage())
                ->withQueryString()
                ->through(fn (MitraWisataOnboarding $destination) => $this->destinationRow($destination));

            return Inertia::render('admin/wisata/tickets/index', [
                'destinations' => $destinations,
                'selectedDestination' => null,
                'tickets' => [
                    'data' => [],
                    'links' => [],
                ],
                'filters' => [
                    'destination_id' => null,
                    'search' => $search,
                    'status' => $status,
                ],
            ]);
        }

        $destination = AdminDataScope::applyCreatedByOrUser(
            MitraWisataOnboarding::query()
                ->with(['user:id,name,email'])
                ->withCount([
                    'tickets',
                    'tickets as active_tickets_count' => fn ($query) => $query->where('is_active', true),
                    'tickets as inactive_tickets_count' => fn ($query) => $query->where('is_active', false),
                ]),
            $request,
        )->findOrFail($destinationId);

        $query = WisataTicket::query()
            ->with(['destination.user:id,name,email'])
            ->where('mitra_wisata_onboarding_id', $destination->id);

        if ($search) {
            $query->where(function ($builder) use ($search) {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhereHas('destination', fn ($destination) => $destination->where('destination_name', 'like', "%{$search}%"))
                    ->orWhereHas('destination.user', fn ($user) => $user->where('name', 'like', "%{$search}%"));
            });
        }

        if ($status) {
            $query->where('is_active', $status === 'active');
        }

        $tickets = $query->latest('id')
            ->paginate(PaginationOptions::perPage())
            ->withQueryString()
            ->through(function (WisataTicket $ticket) {
                return [
                    'id' => $ticket->id,
                    'name' => $ticket->name,
                    'price' => $ticket->price,
                    'weekend_price' => $ticket->weekend_price,
                    'quota' => $ticket->quota,
                    'max_quota_override' => $ticket->max_quota_override,
                    'min_order_quantity' => max(1, (int) ($ticket->min_order_quantity ?? 1)),
                    'max_order_quantity' => $ticket->max_order_quantity,
                    'ticket_kind' => $ticket->ticket_kind ?? 'single',
                    'is_entry_ticket' => (bool) ($ticket->is_entry_ticket ?? true),
                    'is_weekend' => (bool) $ticket->is_weekend,
                    'package_items' => $ticket->package_items ?? [],
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
            'destinations' => null,
            'selectedDestination' => $this->destinationRow($destination),
            'tickets' => $tickets,
            'filters' => [
                'destination_id' => $destination->id,
                'search' => $search,
                'status' => $status,
            ],
        ]);
    }

    private function destinationRow(MitraWisataOnboarding $destination): array
    {
        return [
            'id' => $destination->id,
            'destination_name' => $destination->destination_name,
            'verification_status' => $destination->verification_status,
            'is_live' => (bool) $destination->is_live,
            'tickets_count' => (int) ($destination->tickets_count ?? 0),
            'active_tickets_count' => (int) ($destination->active_tickets_count ?? 0),
            'inactive_tickets_count' => (int) ($destination->inactive_tickets_count ?? 0),
            'owner' => [
                'id' => $destination->user?->id,
                'name' => $destination->user?->name,
                'email' => $destination->user?->email,
            ],
        ];
    }

    public function create(): Response
    {
        return $this->ticketForm(request());
    }

    public function edit(Request $request, WisataTicket $ticket): Response
    {
        if ($ticket->destination) {
            AdminDataScope::authorizeCreatedByOrUser($ticket->destination, $request);
        }

        return $this->ticketForm($request, $ticket);
    }

    private function ticketForm(Request $request, ?WisataTicket $ticket = null): Response
    {
        $destinations = AdminDataScope::applyCreatedByOrUser(
            MitraWisataOnboarding::query()
                ->where('verification_status', 'verified')
                ->where('is_suspended', false),
            $request,
        )
            ->orderBy('destination_name')
            ->get(['id', 'destination_name'])
            ->map(fn ($item) => [
                'id' => $item->id,
                'label' => $item->destination_name ?? 'Destinasi #'.$item->id,
            ])
            ->all();

        $componentTickets = WisataTicket::query()
            ->whereIn('mitra_wisata_onboarding_id', collect($destinations)->pluck('id'))
            ->where('ticket_kind', 'single')
            ->when($ticket, fn ($query) => $query->where('id', '!=', $ticket->id))
            ->orderBy('name')
            ->get(['id', 'mitra_wisata_onboarding_id', 'name', 'price'])
            ->map(fn (WisataTicket $row) => [
                'id' => $row->id,
                'destination_id' => $row->mitra_wisata_onboarding_id,
                'name' => $row->name,
                'price' => $row->price,
            ])
            ->all();

        return Inertia::render('admin/wisata/tickets/create', [
            'destinations' => $destinations,
            'ticket' => $ticket ? [
                'id' => $ticket->id,
                'mitra_wisata_onboarding_id' => $ticket->mitra_wisata_onboarding_id,
                'name' => $ticket->name,
                'description' => $ticket->description,
                'price' => $ticket->price,
                'weekend_price' => $ticket->weekend_price,
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
                'is_active' => (bool) $ticket->is_active,
                'is_closed' => (bool) $ticket->is_closed,
                'is_weekend' => (bool) $ticket->is_weekend,
            ] : null,
            'componentTickets' => $componentTickets,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $destinationRule = Rule::exists('mitra_wisata_onboardings', 'id');
        if (! AdminDataScope::canViewAll($request->user())) {
            $userId = $request->user()?->id ?? 0;
            $destinationRule = $destinationRule->where(fn ($query) => $query
                ->where('created_by', $userId)
                ->orWhere('user_id', $userId));
        }

        $data = $request->validate([
            'mitra_wisata_onboarding_id' => ['required', $destinationRule],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'integer', 'min:0'],
            'weekend_price' => ['nullable', 'integer', 'min:0'],
            'quota' => ['required', 'integer', 'min:0'],
            'daily_quota' => ['nullable', 'integer', 'min:0'],
            'min_order_quantity' => ['nullable', 'integer', 'min:1', 'max:20'],
            'max_order_quantity' => ['nullable', 'integer', 'min:1', 'max:20', 'gte:min_order_quantity'],
            'ticket_type' => ['nullable', 'in:perorangan,grup'],
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
            'is_weekend' => ['nullable', 'boolean'],
        ]);

        if ($request->boolean('is_weekend') && ($data['weekend_price'] ?? null) === null) {
            throw ValidationException::withMessages([
                'weekend_price' => 'Harga weekend wajib diisi untuk tiket dengan harga weekend.',
            ]);
        }

        $ticketKind = $data['ticket_kind'] ?? 'single';
        $packageItems = $this->normalizePackageItems(
            $ticketKind,
            (int) $data['mitra_wisata_onboarding_id'],
            $data['package_items'] ?? []
        );
        $price = $ticketKind === 'package'
            ? $this->calculatePackagePrice($packageItems)
            : (int) $data['price'];

        WisataTicket::create([
            'mitra_wisata_onboarding_id' => $data['mitra_wisata_onboarding_id'],
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'price' => $price,
            'weekend_price' => $request->boolean('is_weekend') ? $data['weekend_price'] : null,
            'quota' => $data['quota'],
            'daily_quota' => $data['daily_quota'] ?? null,
            'min_order_quantity' => $data['min_order_quantity'] ?? 1,
            'max_order_quantity' => $data['max_order_quantity'] ?? null,
            'ticket_type' => $data['ticket_type'] ?? 'perorangan',
            'ticket_kind' => $ticketKind,
            'is_entry_ticket' => $request->has('is_entry_ticket') ? $request->boolean('is_entry_ticket') : true,
            'package_items' => $packageItems,
            'valid_from' => $data['valid_from'] ?? null,
            'valid_until' => $data['valid_until'] ?? null,
            'refund_policy' => $data['refund_policy'] ?? null,
            'is_active' => (bool) ($data['is_active'] ?? false),
            'is_closed' => (bool) ($data['is_closed'] ?? false),
            'is_weekend' => (bool) ($data['is_weekend'] ?? false),
        ]);

        return redirect()->route('admin.wisata.tickets.index')->with('status', 'ticket-created');
    }

    public function update(Request $request, WisataTicket $ticket): RedirectResponse
    {
        if ($ticket->destination) {
            AdminDataScope::authorizeCreatedByOrUser($ticket->destination, $request);
        }

        $destinationRule = Rule::exists('mitra_wisata_onboardings', 'id');
        if (! AdminDataScope::canViewAll($request->user())) {
            $userId = $request->user()?->id ?? 0;
            $destinationRule = $destinationRule->where(fn ($query) => $query
                ->where('created_by', $userId)
                ->orWhere('user_id', $userId));
        }

        $data = $request->validate([
            'mitra_wisata_onboarding_id' => ['sometimes', 'required', $destinationRule],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'price' => ['sometimes', 'required', 'integer', 'min:0'],
            'weekend_price' => ['nullable', 'integer', 'min:0'],
            'quota' => ['sometimes', 'required', 'integer', 'min:0'],
            'daily_quota' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'min_order_quantity' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:20'],
            'max_order_quantity' => ['nullable', 'integer', 'min:1', 'max:20', 'gte:min_order_quantity'],
            'ticket_type' => ['sometimes', 'required', 'in:perorangan,grup'],
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
            'is_weekend' => ['nullable', 'boolean'],
        ]);

        $isWeekend = array_key_exists('is_weekend', $data)
            ? (bool) $data['is_weekend']
            : (bool) $ticket->is_weekend;
        $weekendPrice = array_key_exists('weekend_price', $data)
            ? $data['weekend_price']
            : $ticket->weekend_price;

        if ($isWeekend && $weekendPrice === null) {
            throw ValidationException::withMessages([
                'weekend_price' => 'Harga weekend wajib diisi untuk tiket dengan harga weekend.',
            ]);
        }

        $destinationId = (int) ($data['mitra_wisata_onboarding_id'] ?? $ticket->mitra_wisata_onboarding_id);
        $ticketKind = $data['ticket_kind'] ?? ($ticket->ticket_kind ?? 'single');
        $packageItems = array_key_exists('package_items', $data)
            ? $this->normalizePackageItems(
                $ticketKind,
                $destinationId,
                $data['package_items'] ?? [],
                $ticket->id,
            )
            : ($ticket->package_items ?? null);
        $price = $ticketKind === 'package'
            ? $this->calculatePackagePrice($packageItems)
            : (int) ($data['price'] ?? $ticket->price);

        $ticket->update([
            'mitra_wisata_onboarding_id' => $destinationId,
            'name' => $data['name'] ?? $ticket->name,
            'description' => array_key_exists('description', $data) ? $data['description'] : $ticket->description,
            'price' => $price,
            'weekend_price' => $isWeekend ? $weekendPrice : null,
            'quota' => $data['quota'] ?? $ticket->quota,
            'daily_quota' => array_key_exists('daily_quota', $data) ? $data['daily_quota'] : $ticket->daily_quota,
            'min_order_quantity' => $data['min_order_quantity'] ?? ($ticket->min_order_quantity ?? 1),
            'max_order_quantity' => array_key_exists('max_order_quantity', $data) ? $data['max_order_quantity'] : $ticket->max_order_quantity,
            'ticket_type' => $data['ticket_type'] ?? ($ticket->ticket_type ?? 'perorangan'),
            'ticket_kind' => $ticketKind,
            'is_entry_ticket' => array_key_exists('is_entry_ticket', $data) ? (bool) $data['is_entry_ticket'] : (bool) ($ticket->is_entry_ticket ?? true),
            'package_items' => $packageItems,
            'valid_from' => array_key_exists('valid_from', $data) ? $data['valid_from'] : $ticket->valid_from,
            'valid_until' => array_key_exists('valid_until', $data) ? $data['valid_until'] : $ticket->valid_until,
            'refund_policy' => array_key_exists('refund_policy', $data) ? $data['refund_policy'] : $ticket->refund_policy,
            'is_active' => array_key_exists('is_active', $data) ? (bool) $data['is_active'] : (bool) $ticket->is_active,
            'is_closed' => array_key_exists('is_closed', $data) ? (bool) $data['is_closed'] : (bool) $ticket->is_closed,
            'is_weekend' => $isWeekend,
        ]);

        return back()->with('status', 'ticket-updated');
    }

    public function destroy(Request $request, WisataTicket $ticket): RedirectResponse
    {
        if ($ticket->destination) {
            AdminDataScope::authorizeCreatedByOrUser($ticket->destination, $request);
        }

        $data = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $ticket->delete();

        return back()->with('status', 'ticket-deleted');
    }

    private function normalizePackageItems(string $ticketKind, int $destinationId, array $items): ?array
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

        $validTicketIds = WisataTicket::query()
            ->where('mitra_wisata_onboarding_id', $destinationId)
            ->where('ticket_kind', 'single')
            ->whereIn('id', $normalized->pluck('ticket_id'))
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

    private function calculatePackagePrice(?array $packageItems): int
    {
        if (! $packageItems) {
            return 0;
        }

        $prices = WisataTicket::query()
            ->whereIn('id', collect($packageItems)->pluck('ticket_id'))
            ->pluck('price', 'id');

        return collect($packageItems)->sum(
            fn (array $item) => (int) ($prices[$item['ticket_id']] ?? 0) * (int) $item['quantity']
        );
    }
}
