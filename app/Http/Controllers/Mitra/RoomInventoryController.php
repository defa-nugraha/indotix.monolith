<?php

namespace App\Http\Controllers\Mitra;

use App\Http\Controllers\Controller;
use App\Models\Hotel;
use App\Models\RoomInventory;
use App\Models\RoomType;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RoomInventoryController extends Controller
{
    private const SUSPENDED_STATUS = 'suspended';

    public function index(Request $request): Response
    {
        $user = $request->user();

        $query = RoomInventory::query()
            ->with('roomType')
            ->whereHas('roomType.hotel', fn ($builder) => $builder->where('vendor_id', $user->id))
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
            ->whereHas('roomType.hotel', fn ($builder) => $builder->where('vendor_id', $user->id));

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
            'roomTypeOptions' => $this->roomTypeOptions($user->id),
            'hotelOptions' => $this->hotelOptions($user->id),
            'monthGroups' => $monthGroups,
            'filters' => [
                'hotel_id' => $request->input('hotel_id'),
                'room_type_id' => $request->input('room_type_id'),
                'date_from' => $request->input('date_from'),
                'date_to' => $request->input('date_to'),
            ],
            'isMitra' => true,
            'basePath' => '/mitra/room-inventories',
        ]);
    }

    public function create(Request $request): Response|RedirectResponse
    {
        $user = $request->user();
        if (! $this->editableRoomTypesQuery((int) $user->id)->exists()) {
            return redirect()->route('mitra.room-types.index');
        }

        return Inertia::render('room-inventories/create', [
            'roomTypeOptions' => $this->roomTypeOptions($user->id),
            'isMitra' => true,
            'basePath' => '/mitra/room-inventories',
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $this->validateInventory($request, $user->id);

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

            return redirect()->route('mitra.room-inventories.index');
        }

        RoomInventory::create($validated);

        return redirect()->route('mitra.room-inventories.index');
    }

    public function edit(Request $request, RoomInventory $roomInventory): Response
    {
        $user = $request->user();
        if ((int) $roomInventory->roomType?->hotel?->vendor_id !== (int) $user->id) {
            abort(404);
        }

        $roomInventory->load('roomType');

        return Inertia::render('room-inventories/edit', [
            'inventory' => $this->toPayload($roomInventory),
            'roomTypeOptions' => $this->roomTypeOptions($user->id),
            'isMitra' => true,
            'basePath' => '/mitra/room-inventories',
        ]);
    }

    public function update(Request $request, RoomInventory $roomInventory): RedirectResponse
    {
        $user = $request->user();
        if ((int) $roomInventory->roomType?->hotel?->vendor_id !== (int) $user->id) {
            abort(404);
        }

        $this->ensureInventoryEditable($roomInventory);
        $validated = $this->validateInventory($request, $user->id, $roomInventory->id);
        $roomInventory->update($validated);

        return redirect()->route('mitra.room-inventories.index');
    }

    public function destroy(Request $request, RoomInventory $roomInventory): RedirectResponse
    {
        $user = $request->user();
        if ((int) $roomInventory->roomType?->hotel?->vendor_id !== (int) $user->id) {
            abort(404);
        }

        $this->ensureInventoryEditable($roomInventory);
        $roomInventory->delete();

        return redirect()->route('mitra.room-inventories.index');
    }

    public function bulkDestroy(Request $request): RedirectResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:room_inventories,id'],
        ]);

        RoomInventory::query()
            ->whereIn('id', $data['ids'])
            ->whereHas('roomType', fn ($builder) => $builder
                ->where('status', '!=', self::SUSPENDED_STATUS)
                ->whereHas('hotel', fn ($hotel) => $hotel
                    ->where('vendor_id', $user->id)
                    ->where('status', '!=', self::SUSPENDED_STATUS)))
            ->delete();

        return redirect()->route('mitra.room-inventories.index');
    }

    private function validateInventory(Request $request, int $vendorId, ?int $inventoryId = null): array
    {
        $isBulk = $request->filled('date_from') || $request->filled('date_to');

        $roomTypeRule = Rule::exists('room_types', 'id')->where(function ($query) use ($vendorId) {
            $query
                ->where('status', '!=', self::SUSPENDED_STATUS)
                ->whereIn(
                    'hotel_id',
                    Hotel::query()
                        ->where('vendor_id', $vendorId)
                        ->where('status', '!=', self::SUSPENDED_STATUS)
                        ->select('id')
                );
        });

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

    private function roomTypeOptions(int $vendorId): array
    {
        return $this->editableRoomTypesQuery($vendorId)
            ->with('hotel')
            ->orderBy('name')
            ->get()
            ->map(fn (RoomType $roomType) => [
                'id' => $roomType->id,
                'label' => sprintf('%s — %s', $roomType->name, $roomType->hotel?->name ?? '-'),
            ])
            ->all();
    }

    private function hotelOptions(int $vendorId): array
    {
        return Hotel::query()
            ->select('id', 'name')
            ->where('vendor_id', $vendorId)
            ->where('status', '!=', self::SUSPENDED_STATUS)
            ->orderBy('name')
            ->get()
            ->map(fn (Hotel $hotel) => [
                'id' => $hotel->id,
                'label' => $hotel->name,
            ])
            ->all();
    }

    private function editableRoomTypesQuery(int $vendorId)
    {
        return RoomType::query()
            ->where('status', '!=', self::SUSPENDED_STATUS)
            ->whereHas('hotel', fn ($builder) => $builder
                ->where('vendor_id', $vendorId)
                ->where('status', '!=', self::SUSPENDED_STATUS));
    }

    private function ensureInventoryEditable(RoomInventory $inventory): void
    {
        if (
            $inventory->roomType?->status !== self::SUSPENDED_STATUS
            && $inventory->roomType?->hotel?->status !== self::SUSPENDED_STATUS
        ) {
            return;
        }

        throw ValidationException::withMessages([
            'room_type_id' => 'Inventory ini sedang terkait produk yang disuspend oleh admin. Mitra tidak dapat mengubahnya.',
        ]);
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
}
