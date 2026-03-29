<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SpecialProgram;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;

class SpecialProgramController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $payload = [
            'q' => $request->input('q'),
            'category' => $request->input('category'),
        ];

        $data = validator($payload, [
            'q' => ['nullable', 'string', 'max:255'],
            'category' => ['nullable', 'in:meeting,wedding,travel'],
        ])->validate();

        $programs = SpecialProgram::query()
            ->where('is_active', true)
            ->when($data['q'] ?? null, fn ($query, $term) => $query->where('name', 'like', "%{$term}%"))
            ->when($data['category'] ?? null, fn ($query, $category) => $query->where('category', $category))
            ->with('variants')
            ->latest()
            ->get();

        $results = $programs->map(function (SpecialProgram $program) {
            $variantMin = $program->variants->whereNotNull('price')->min('price');
            $minPrice = $variantMin !== null ? (int) $variantMin : (int) $program->base_price;

            return [
                'id' => $program->id,
                'encrypted_id' => Crypt::encryptString((string) $program->id),
                'slug' => $program->slug,
                'name' => $program->name,
                'category' => $program->category,
                'min_price' => $minPrice > 0 ? $minPrice : null,
                'image_url' => $program->image_path ? Storage::url($program->image_path) : null,
            ];
        });

        return response()->json([
            'filters' => [
                'q' => $data['q'] ?? null,
                'category' => $data['category'] ?? null,
            ],
            'programs' => $results,
        ]);
    }

    public function show(Request $request, string $program): JsonResponse
    {
        $programModel = SpecialProgram::query()
            ->where('is_active', true)
            ->where('slug', $program)
            ->first();

        if (! $programModel) {
            $programId = $this->resolveId($program);
            $programModel = SpecialProgram::query()
                ->where('is_active', true)
                ->where('id', $programId)
                ->firstOrFail();
        }

        $program = $programModel;
        $program->load(['variants.facilities', 'facilities', 'inventories']);

        return response()->json([
            'program' => [
                'id' => $program->id,
                'encrypted_id' => Crypt::encryptString((string) $program->id),
                'slug' => $program->slug,
                'name' => $program->name,
                'category' => $program->category,
                'description' => $program->description,
                'base_price' => $program->base_price,
                'capacity' => $program->capacity ?? 0,
                'image_url' => $program->image_path ? Storage::url($program->image_path) : null,
            ],
            'variants' => $program->variants
                ->sortBy('sort_order')
                ->values()
                ->map(fn ($variant) => [
                    'id' => $variant->id,
                    'name' => $variant->name,
                    'price' => $variant->price,
                    'capacity' => $variant->capacity ?? 0,
                    'facilities' => $variant->facilities
                        ->sortBy('sort_order')
                        ->values()
                        ->pluck('content')
                        ->all(),
                ])
                ->all(),
            'facilities' => $program->facilities
                ->sortBy('sort_order')
                ->values()
                ->pluck('content')
                ->all(),
            'inventories' => $program->inventories
                ->sortBy('date')
                ->values()
                ->map(fn ($inventory) => [
                    'date' => $inventory->date?->format('Y-m-d'),
                    'capacity' => $inventory->capacity ?? 0,
                ])
                ->all(),
        ]);
    }

    private function resolveId(string $value): int
    {
        if (ctype_digit($value)) {
            return (int) $value;
        }

        try {
            return (int) Crypt::decryptString($value);
        } catch (\Throwable $exception) {
            abort(404);
        }

        return 0;
    }
}
