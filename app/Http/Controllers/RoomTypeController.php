<?php

namespace App\Http\Controllers;

use App\Models\Hotel;
use App\Models\RoomImage;
use App\Models\RoomType;
use App\Services\MediaCompressionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RoomTypeController extends Controller
{
    private const STATUSES = ['draft', 'active', 'suspended'];

    public function index(): Response
    {
        $roomTypesQuery = RoomType::query()
            ->with(['hotel', 'images'])
            ->latest();

        $request = request();

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $roomTypesQuery->where(function ($builder) use ($search) {
                $builder
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('bed_type', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $roomTypesQuery->where('status', $request->string('status')->toString());
        }

        if ($request->filled('hotel_id')) {
            $roomTypesQuery->where('hotel_id', (int) $request->input('hotel_id'));
        }

        $roomTypes = $roomTypesQuery
            ->paginate(10)
            ->withQueryString()
            ->through(fn (RoomType $roomType) => $this->toPayload($roomType));

        return Inertia::render('room-types/index', [
            'roomTypes' => $roomTypes,
            'filters' => [
                'search' => $request->input('search'),
                'status' => $request->input('status'),
                'hotel_id' => $request->input('hotel_id'),
            ],
            'statusOptions' => self::STATUSES,
            'hotelOptions' => $this->hotelOptions(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('room-types/create', [
            'hotelOptions' => $this->hotelOptions(),
            'statusOptions' => self::STATUSES,
        ]);
    }

    public function store(Request $request, MediaCompressionService $mediaCompression): RedirectResponse
    {
        $validated = $this->validateRoomType($request);
        $images = $validated['images'] ?? [];
        unset($validated['images']);

        $roomType = RoomType::create($validated);
        $this->syncImages($roomType, $images, $mediaCompression);

        return redirect()->route('room-types.index');
    }

    public function edit(RoomType $roomType): Response
    {
        $roomType->load(['hotel', 'images']);

        return Inertia::render('room-types/edit', [
            'roomType' => $this->toPayload($roomType),
            'hotelOptions' => $this->hotelOptions(),
            'statusOptions' => self::STATUSES,
        ]);
    }

    public function show(RoomType $roomType): Response
    {
        $roomType->load(['hotel', 'images']);

        return Inertia::render('room-types/show', [
            'roomType' => $this->toPayload($roomType),
        ]);
    }

    public function update(Request $request, RoomType $roomType, MediaCompressionService $mediaCompression): RedirectResponse
    {
        $validated = $this->validateRoomType($request);
        $images = $validated['images'] ?? [];
        unset($validated['images']);

        $roomType->update($validated);
        $this->syncImages($roomType, $images, $mediaCompression);

        return redirect()->route('room-types.index');
    }

    public function destroy(RoomType $roomType): RedirectResponse
    {
        $roomType->delete();

        return redirect()->route('room-types.index');
    }

    public function destroyImage(RoomType $roomType, RoomImage $roomImage): RedirectResponse
    {
        if ($roomImage->room_type_id !== $roomType->id) {
            abort(404);
        }

        if ($roomImage->image_url) {
            Storage::disk('public')->delete($roomImage->image_url);
        }

        $roomImage->delete();

        return redirect()->back();
    }

    private function validateRoomType(Request $request): array
    {
        return $request->validate([
            'hotel_id' => ['required', 'integer', 'exists:hotels,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'max_guest' => ['nullable', 'integer', 'min:1', 'max:50'],
            'bed_type' => ['nullable', 'string', 'max:64'],
            'base_price' => ['required', 'numeric', 'min:0'],
            'strike_price' => ['nullable', 'numeric', 'min:0'],
            'total_rooms' => ['required', 'integer', 'min:0'],
            'status' => ['required', Rule::in(self::STATUSES)],
            'images' => ['nullable', 'array'],
            'images.*' => ['file', 'image'],
        ]);
    }

    private function syncImages(RoomType $roomType, array $images, MediaCompressionService $mediaCompression): void
    {
        if (empty($images)) {
            return;
        }

        $oldPaths = $roomType->images()->pluck('image_url')->all();
        $roomType->images()->delete();

        if (!empty($oldPaths)) {
            Storage::disk('public')->delete($oldPaths);
        }

        $paths = collect($images)
            ->map(fn ($file) => $mediaCompression->store($file, 'room-images', 'public'))
            ->filter()
            ->unique()
            ->values();

        $roomType->images()->createMany(
            $paths->map(fn (string $path) => ['image_url' => $path])->all()
        );
    }

    private function hotelOptions(): array
    {
        return Hotel::query()
            ->select('id', 'name')
            ->orderBy('name')
            ->get()
            ->map(fn (Hotel $hotel) => [
                'id' => $hotel->id,
                'label' => $hotel->name,
            ])
            ->all();
    }

    private function toPayload(RoomType $roomType): array
    {
        return [
            'id' => $roomType->id,
            'hotel_id' => $roomType->hotel_id,
            'hotel_name' => $roomType->hotel?->name,
            'name' => $roomType->name,
            'description' => $roomType->description,
            'max_guest' => $roomType->max_guest,
            'bed_type' => $roomType->bed_type,
            'base_price' => $roomType->base_price,
            'strike_price' => $roomType->strike_price,
            'total_rooms' => $roomType->total_rooms,
            'status' => $roomType->status,
            'images' => $roomType->images
                ->map(fn ($image) => [
                    'id' => $image->id,
                    'url' => Storage::url($image->image_url),
                ])
                ->values()
                ->all(),
        ];
    }
}
