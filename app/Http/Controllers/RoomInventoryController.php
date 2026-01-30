<?php

namespace App\Http\Controllers;

use App\Models\RoomInventory;
use App\Models\RoomType;
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
            ->latest('date');

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
            ->paginate(10)
            ->withQueryString()
            ->through(fn (RoomInventory $inventory) => $this->toPayload($inventory));

        return Inertia::render('room-inventories/index', [
            'inventories' => $inventories,
            'roomTypeOptions' => $this->roomTypeOptions(),
            'filters' => [
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

        RoomInventory::create($validated);

        return redirect()->route('room-inventories.index');
    }

    public function edit(RoomInventory $roomInventory): Response
    {
        $roomInventory->load('roomType');

        return Inertia::render('room-inventories/edit', [
            'inventory' => $this->toPayload($roomInventory),
            'roomTypeOptions' => $this->roomTypeOptions(),
        ]);
    }

    public function update(Request $request, RoomInventory $roomInventory): RedirectResponse
    {
        $validated = $this->validateInventory($request, $roomInventory->id);
        $roomInventory->update($validated);

        return redirect()->route('room-inventories.index');
    }

    public function destroy(RoomInventory $roomInventory): RedirectResponse
    {
        $roomInventory->delete();

        return redirect()->route('room-inventories.index');
    }

    private function validateInventory(Request $request, ?int $inventoryId = null): array
    {
        return $request->validate([
            'date' => ['required', 'date'],
            'available_rooms' => ['required', 'integer', 'min:0'],
            'price_override' => ['nullable', 'numeric', 'min:0'],
            'is_closed' => ['boolean'],
            'room_type_id' => [
                'required',
                'integer',
                'exists:room_types,id',
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
        return RoomType::query()
            ->with('hotel')
            ->orderBy('name')
            ->get()
            ->map(fn (RoomType $roomType) => [
                'id' => $roomType->id,
                'label' => sprintf('%s — %s', $roomType->name, $roomType->hotel?->name ?? '-'),
            ])
            ->all();
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
        ];
    }
}
