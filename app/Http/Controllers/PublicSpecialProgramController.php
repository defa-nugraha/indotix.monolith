<?php

namespace App\Http\Controllers;

use App\Models\SpecialProgram;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PublicSpecialProgramController extends Controller
{
    public function index(Request $request): Response
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

        return Inertia::render('public/special-programs/search', [
            'filters' => [
                'q' => $data['q'] ?? null,
                'category' => $data['category'] ?? null,
            ],
            'programs' => $results,
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
        $program->load(['variants', 'facilities']);

        return Inertia::render('public/special-programs/show', [
            'program' => [
                'id' => $program->id,
                'encrypted_id' => Crypt::encryptString((string) $program->id),
                'slug' => $program->slug,
                'name' => $program->name,
                'category' => $program->category,
                'description' => $program->description,
                'base_price' => $program->base_price,
                'capacity' => $program->capacity,
                'image_url' => $program->image_path ? Storage::url($program->image_path) : null,
                'variants' => $program->variants
                    ->sortBy('sort_order')
                    ->values()
                    ->map(fn ($variant) => [
                        'id' => $variant->id,
                        'name' => $variant->name,
                        'price' => $variant->price,
                        'capacity' => $variant->capacity,
                    ])
                    ->all(),
                'facilities' => $program->facilities
                    ->sortBy('sort_order')
                    ->values()
                    ->pluck('content')
                    ->all(),
            ],
        ]);
    }
}
