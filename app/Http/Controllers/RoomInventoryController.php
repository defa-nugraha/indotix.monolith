<?php

namespace App\Http\Controllers;

use App\Models\RoomInventory;
use App\Models\RoomType;
use App\Models\Hotel;
use App\Support\AdminDataScope;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RoomInventoryController extends Controller
{
    public function index(Request $request): Response
    {
        $query = RoomInventory::query()
            ->with('roomType')
            ->whereHas('roomType', fn ($builder) => $this->applyRoomTypeScope($builder, $request))
            ->latest('date');

        if ($request->filled('hotel_id')) {
            $hotelId = (int) $request->input('hotel_id');
            $query->whereHas('roomType', fn ($builder) => $builder->where('hotel_id', $hotelId));
        }

        if ($request->filled('room_type_id')) {
            $query->where('room_type_id', $request->input('room_type_id'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('date', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('date', '<=', $request->input('date_to'));
        }

        $inventories = $query
            ->paginate(\App\Support\PaginationOptions::perPage())
            ->withQueryString()
            ->through(fn (RoomInventory $inventory) => $this->toPayload($inventory));

        $groupQuery = RoomInventory::query()
            ->selectRaw('DATE_FORMAT(date, "%Y-%m") as month_key, COUNT(*) as total')
            ->whereHas('roomType', fn ($builder) => $this->applyRoomTypeScope($builder, $request));

        if ($request->filled('hotel_id')) {
            $hotelId = (int) $request->input('hotel_id');
            $groupQuery->whereHas('roomType', fn ($builder) => $builder->where('hotel_id', $hotelId));
        }

        if ($request->filled('room_type_id')) {
            $groupQuery->where('room_type_id', $request->input('room_type_id'));
        }

        $monthGroups = $groupQuery
            ->groupBy('month_key')
            ->orderByDesc('month_key')
            ->get()
            ->map(function ($row) {
                $start = Carbon::createFromFormat('Y-m', $row->month_key)->startOfMonth();
                $end = $start->copy()->endOfMonth();
                return [
                    'key' => $row->month_key,
                    'label' => $start->isoFormat('MMMM YYYY'),
                    'total' => (int) $row->total,
                    'date_from' => $start->toDateString(),
                    'date_to' => $end->toDateString(),
                ];
            });

        return Inertia::render('room-inventories/index', [
            'inventories' => $inventories,
            'roomTypeOptions' => $this->roomTypeOptions(),
            'hotelOptions' => $this->hotelOptions(),
            'monthGroups' => $monthGroups,
            'filters' => [
                'hotel_id' => $request->input('hotel_id'),
                'room_type_id' => $request->input('room_type_id'),
                'date_from' => $request->input('date_from'),
                'date_to' => $request->input('date_to'),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('room-inventories/create', [
            'roomTypeOptions' => $this->roomTypeOptions(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateInventory($request);

        if (! empty($validated['date_from']) && ! empty($validated['date_to'])) {
            $start = Carbon::parse($validated['date_from']);
            $end = Carbon::parse($validated['date_to']);
            $period = CarbonPeriod::create($start, $end);

            foreach ($period as $date) {
                RoomInventory::updateOrCreate(
                    [
                        'room_type_id' => $validated['room_type_id'],
                        'date' => $date->toDateString(),
                    ],
                    [
                        'available_rooms' => $validated['available_rooms'],
                        'price_override' => $validated['price_override'] ?? null,
                        'is_closed' => $validated['is_closed'] ?? false,
                        'breakfast_included' => $validated['breakfast_included'] ?? false,
                        'smoking_allowed' => $validated['smoking_allowed'] ?? false,
                    ]
                );
            }

            return redirect()->route('room-inventories.index');
        }

        RoomInventory::create($validated);

        return redirect()->route('room-inventories.index');
    }

    public function edit(RoomInventory $roomInventory): Response
    {
        $this->authorizeInventory($roomInventory, request());
        $roomInventory->load('roomType');

        return Inertia::render('room-inventories/edit', [
            'inventory' => $this->toPayload($roomInventory),
            'roomTypeOptions' => $this->roomTypeOptions(),
        ]);
    }

    public function update(Request $request, RoomInventory $roomInventory): RedirectResponse
    {
        $this->authorizeInventory($roomInventory, $request);
        $validated = $this->validateInventory($request, $roomInventory->id);
        $roomInventory->update($validated);

        return redirect()->route('room-inventories.index');
    }

    public function destroy(RoomInventory $roomInventory): RedirectResponse
    {
        $this->authorizeInventory($roomInventory, request());
        $roomInventory->delete();

        return redirect()->route('room-inventories.index');
    }

    public function bulkDestroy(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:room_inventories,id'],
        ]);

        RoomInventory::query()
            ->whereIn('id', $data['ids'])
            ->whereHas('roomType', fn ($builder) => $this->applyRoomTypeScope($builder, $request))
            ->delete();

        return redirect()->route('room-inventories.index');
    }

    private function validateInventory(Request $request, ?int $inventoryId = null): array
    {
        $isBulk = $request->filled('date_from') || $request->filled('date_to');
        $roomTypeRule = Rule::exists('room_types', 'id');
        if (! AdminDataScope::canViewAll($request->user())) {
            $userId = $request->user()?->id ?? 0;
            $ownedHotelIds = Hotel::query()
                ->where('vendor_id', $userId)
                ->select('id');
            $roomTypeRule = $roomTypeRule->where(fn ($query) => $query
                ->where('created_by', $userId)
                ->orWhereIn('hotel_id', $ownedHotelIds));
        }

        if ($isBulk && $inventoryId === null) {
            return $request->validate([
                'date_from' => ['required', 'date'],
                'date_to' => ['required', 'date', 'after_or_equal:date_from'],
                'available_rooms' => ['required', 'integer', 'min:0'],
                'price_override' => ['nullable', 'numeric', 'min:0'],
                'is_closed' => ['boolean'],
                'breakfast_included' => ['boolean'],
                'smoking_allowed' => ['boolean'],
                'room_type_id' => ['required', 'integer', $roomTypeRule],
            ]);
        }

        return $request->validate([
            'date' => ['required', 'date'],
            'available_rooms' => ['required', 'integer', 'min:0'],
            'price_override' => ['nullable', 'numeric', 'min:0'],
            'is_closed' => ['boolean'],
            'breakfast_included' => ['boolean'],
            'smoking_allowed' => ['boolean'],
            'room_type_id' => [
                'required',
                'integer',
                $roomTypeRule,
                Rule::unique('room_inventories')
                    ->where(fn ($query) => $query
                        ->whereDate('date', $request->input('date'))
                        ->where('room_type_id', $request->input('room_type_id'))
                    )
                    ->ignore($inventoryId),
            ],
        ]);
    }

    private function roomTypeOptions(): array
    {
        return $this->applyRoomTypeScope(RoomType::query(), request())
            ->with('hotel')
            ->orderBy('name')
            ->get()
            ->map(fn (RoomType $roomType) => [
                'id' => $roomType->id,
                'label' => sprintf('%s — %s', $roomType->name, $roomType->hotel?->name ?? '-'),
            ])
            ->all();
    }

    private function hotelOptions(): array
    {
        return AdminDataScope::applyCreatedByOrColumn(Hotel::query(), request(), 'vendor_id')
            ->select('id', 'name')
            ->orderBy('name')
            ->get()
            ->map(fn (Hotel $hotel) => [
                'id' => $hotel->id,
                'label' => $hotel->name,
            ])
            ->all();
    }

    private function applyRoomTypeScope($query, Request $request)
    {
        if (AdminDataScope::canViewAll($request->user())) {
            return $query;
        }

        $userId = $request->user()?->id ?? 0;

        return $query->where(function ($builder) use ($userId) {
            $builder
                ->where('created_by', $userId)
                ->orWhereHas('hotel', fn ($hotel) => $hotel->where('vendor_id', $userId));
        });
    }

    private function toPayload(RoomInventory $inventory): array
    {
        return [
            'id' => $inventory->id,
            'room_type_id' => $inventory->room_type_id,
            'room_type_name' => $inventory->roomType?->name,
            'hotel_name' => $inventory->roomType?->hotel?->name,
            'date' => $inventory->date?->format('Y-m-d'),
            'available_rooms' => $inventory->available_rooms,
            'price_override' => $inventory->price_override,
            'is_closed' => $inventory->is_closed,
            'breakfast_included' => $inventory->breakfast_included,
            'smoking_allowed' => $inventory->smoking_allowed,
        ];
    }

    private function authorizeInventory(RoomInventory $inventory, Request $request): void
    {
        $inventory->loadMissing('roomType.hotel');

        if (! $inventory->roomType) {
            abort(404);
        }

        if (AdminDataScope::canViewAll($request->user())) {
            return;
        }

        $userId = $request->user()?->id ?? 0;

        abort_unless(
            (int) $inventory->roomType->created_by === (int) $userId
            || (int) $inventory->roomType->hotel?->vendor_id === (int) $userId,
            404,
        );
    }
}
