<?php

namespace App\Http\Controllers;

use App\Models\SpecialProgram;
use App\Services\Discovery\DiscoveryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PublicSpecialProgramController extends Controller
{
    public function index(Request $request, DiscoveryService $discovery): Response
    {
        $listing = $discovery->listing('special-programs', $request);
        $programs = collect($listing['data'] ?? [])->map(fn (array $item) => [
            'id' => $item['id'] ?? null,
            'encrypted_id' => $item['encrypted_id'] ?? $item['id'] ?? null,
            'slug' => $item['slug'] ?? null,
            'name' => $item['name'] ?? $item['title'] ?? '',
            'category' => data_get($item, 'metadata.category'),
            'min_price' => $item['price'] ?? null,
            'image_url' => $item['image_url'] ?? $item['image'] ?? null,
        ])->values();

        return Inertia::render('public/special-programs/search', [
            'filters' => [
                'q' => $request->input('q'),
                'category' => $request->input('category'),
                'sort' => $request->input('sort'),
            ],
            'programs' => $programs,
            'discovery' => $listing['discovery'] ?? null,
            'meta' => $listing['meta'] ?? null,
        ]);
    }

    public function show(Request $request, string $program): Response|RedirectResponse
    {
        $programModel = SpecialProgram::query()
            ->where('is_active', true)
            ->where('slug', $program)
            ->first();

        if (! $programModel) {
            try {
                $programId = Crypt::decryptString($program);
                $programModel = SpecialProgram::query()
                    ->where('is_active', true)
                    ->where('id', $programId)
                    ->first();
            } catch (\Throwable $exception) {
                $programModel = null;
            }
        }

        if (! $programModel) {
            abort(404);
        }

        if ($programModel->slug && $programModel->slug !== $program) {
            return redirect()->route('special-programs.show', ['program' => $programModel->slug]);
        }

        $program = $programModel;
        $program->load(['variants.facilities', 'facilities', 'inventories']);

        return Inertia::render('public/special-programs/show', [
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
            ],
        ]);
    }
}
