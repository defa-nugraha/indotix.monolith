<?php

namespace App\Http\Controllers;

use App\Models\Hotel;
use App\Models\RoomImage;
use App\Models\RoomType;
use App\Services\MediaCompressionService;
use App\Support\AdminDataScope;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RoomTypeController extends Controller
{
    private const STATUSES = ['draft', 'active', 'suspended'];

    public function index(Request $request): Response
    {
        $roomTypesQuery = AdminDataScope::applyCreatedBy(RoomType::query(), $request)
            ->with(['hotel', 'images'])
            ->latest();

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

        $perPage = \App\Support\PaginationOptions::perPage($request);

        $roomTypes = $roomTypesQuery
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (RoomType $roomType) => $this->toPayload($roomType));

        return Inertia::render('room-types/index', [
            'roomTypes' => $roomTypes,
            'filters' => [
                'search' => $request->input('search'),
                'status' => $request->input('status'),
                'hotel_id' => $request->input('hotel_id'),
                'per_page' => $perPage,
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
        AdminDataScope::authorizeCreatedBy($roomType, request());
        $roomType->load(['hotel', 'images']);

        return Inertia::render('room-types/edit', [
            'roomType' => $this->toPayload($roomType),
            'hotelOptions' => $this->hotelOptions(),
            'statusOptions' => self::STATUSES,
        ]);
    }

    public function show(RoomType $roomType): Response
    {
        AdminDataScope::authorizeCreatedBy($roomType, request());
        $roomType->load(['hotel', 'images']);

        return Inertia::render('room-types/show', [
            'roomType' => $this->toPayload($roomType),
        ]);
    }

    public function update(Request $request, RoomType $roomType, MediaCompressionService $mediaCompression): RedirectResponse
    {
        AdminDataScope::authorizeCreatedBy($roomType, $request);
        $validated = $this->validateRoomType($request);
        $images = $validated['images'] ?? [];
        unset($validated['images']);

        $roomType->update($validated);
        $this->syncImages($roomType, $images, $mediaCompression);

        return redirect()->route('room-types.index');
    }

    public function destroy(RoomType $roomType): RedirectResponse
    {
        AdminDataScope::authorizeCreatedBy($roomType, request());
        $roomType->delete();

        return redirect()->route('room-types.index');
    }

    public function destroyImage(RoomType $roomType, RoomImage $roomImage): RedirectResponse
    {
        AdminDataScope::authorizeCreatedBy($roomType, request());

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
        $hotelRule = Rule::exists('hotels', 'id');
        if (! AdminDataScope::canViewAll($request->user())) {
            $hotelRule = $hotelRule->where('created_by', $request->user()?->id ?? 0);
        }

        return $request->validate([
            'hotel_id' => ['required', 'integer', $hotelRule],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'max_guest' => ['nullable', 'integer', 'min:1', 'max:50'],
            'included_adults' => ['nullable', 'integer', 'min:1', 'max:50'],
            'extra_bed_max' => ['nullable', 'integer', 'min:0', 'max:50'],
            'extra_bed_price' => ['nullable', 'numeric', 'min:0'],
            'extra_adult_price' => ['nullable', 'numeric', 'min:0'],
            'extra_child_price' => ['nullable', 'numeric', 'min:0'],
            'child_age_max' => ['nullable', 'integer', 'min:0', 'max:17'],
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
        return AdminDataScope::applyCreatedBy(Hotel::query(), request())
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
            'included_adults' => $roomType->included_adults,
            'extra_bed_max' => $roomType->extra_bed_max,
            'extra_bed_price' => $roomType->extra_bed_price,
            'extra_adult_price' => $roomType->extra_adult_price,
            'extra_child_price' => $roomType->extra_child_price,
            'child_age_max' => $roomType->child_age_max,
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
