<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SpecialProgram;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class SpecialProgramController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->string('status')->toString();
        $category = $request->string('category')->toString();
        $query = SpecialProgram::query()->latest();
        if ($status) {
            $query->where('is_active', $status === 'published');
        }
        if ($category) {
            $query->where('category', $category);
        }

        return Inertia::render('admin/special-programs/index', [
            'programs' => $query->paginate(20)->withQueryString(),
            'filters' => [
                'status' => $status,
                'category' => $category,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/special-programs/create', [
            'program' => null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateProgram($request, true);

        return DB::transaction(function () use ($request, $data) {
            $program = new SpecialProgram();
            $program->fill([
                'name' => $data['name'],
                'program_type' => 'package',
                'category' => $data['category'],
                'description' => $data['description'] ?? null,
                'base_price' => (int) ($data['base_price'] ?? 0),
                'capacity' => $data['capacity'] ?? null,
                'is_active' => (bool) ($data['is_active'] ?? false),
                'status' => ($data['is_active'] ?? false) ? 'published' : 'draft',
            ]);

            if ($request->hasFile('image')) {
                $program->image_path = $request->file('image')->store('special-programs', 'public');
            }

            $program->save();
            $this->syncVariants($program, $data['variants'] ?? []);
            $this->syncFacilities($program, $data['facilities'] ?? []);

            return redirect()
                ->route('admin.special-programs.show', $program)
                ->with('status', 'special-program-created');
        });
    }

    public function edit(SpecialProgram $program): Response
    {
        $program->load(['variants', 'facilities']);

        return Inertia::render('admin/special-programs/create', [
            'program' => [
                'id' => $program->id,
                'name' => $program->name,
                'category' => $program->category,
                'description' => $program->description,
                'base_price' => $program->base_price,
                'capacity' => $program->capacity,
                'is_active' => $program->is_active,
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

    public function update(Request $request, SpecialProgram $program): RedirectResponse
    {
        $data = $this->validateProgram($request, false);

        return DB::transaction(function () use ($request, $program, $data) {
            $program->fill([
                'name' => $data['name'],
                'program_type' => 'package',
                'category' => $data['category'],
                'description' => $data['description'] ?? null,
                'base_price' => (int) ($data['base_price'] ?? 0),
                'capacity' => $data['capacity'] ?? null,
                'is_active' => (bool) ($data['is_active'] ?? false),
                'status' => ($data['is_active'] ?? false) ? 'published' : 'draft',
            ]);

            if ($request->hasFile('image')) {
                if ($program->image_path) {
                    Storage::disk('public')->delete($program->image_path);
                }
                $program->image_path = $request->file('image')->store('special-programs', 'public');
            }

            $program->save();
            $this->syncVariants($program, $data['variants'] ?? []);
            $this->syncFacilities($program, $data['facilities'] ?? []);

            return back()->with('status', 'special-program-updated');
        });
    }

    public function show(SpecialProgram $program): Response
    {
        $program->load(['variants', 'facilities']);

        return Inertia::render('admin/special-programs/show', [
            'program' => [
                'id' => $program->id,
                'name' => $program->name,
                'category' => $program->category,
                'description' => $program->description,
                'base_price' => $program->base_price,
                'capacity' => $program->capacity,
                'is_active' => $program->is_active,
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

    public function destroy(SpecialProgram $program): RedirectResponse
    {
        if ($program->image_path) {
            Storage::disk('public')->delete($program->image_path);
        }
        $program->delete();

        return redirect()->route('admin.special-programs.index');
    }

    public function updateStatus(Request $request, SpecialProgram $program): RedirectResponse
    {
        $data = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $program->update([
            'is_active' => (bool) $data['is_active'],
            'status' => (bool) $data['is_active'] ? 'published' : 'draft',
        ]);

        return back();
    }

    private function validateProgram(Request $request, bool $isCreate): array
    {
        $imageRule = $isCreate ? ['required', 'image', 'max:4096'] : ['nullable', 'image', 'max:4096'];

        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'in:meeting,wedding,travel'],
            'base_price' => ['required', 'integer', 'min:0'],
            'description' => ['nullable', 'string'],
            'capacity' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'image' => $imageRule,
            'variants' => ['nullable', 'array'],
            'variants.*.name' => ['nullable', 'string', 'max:255'],
            'variants.*.price' => ['nullable', 'integer', 'min:0'],
            'variants.*.capacity' => ['nullable', 'integer', 'min:0'],
            'facilities' => ['nullable', 'array'],
            'facilities.*' => ['nullable', 'string', 'max:255'],
        ]);
    }

    private function syncVariants(SpecialProgram $program, array $variants): void
    {
        $program->variants()->delete();

        collect($variants)
            ->filter(fn ($variant) => filled($variant['name'] ?? null))
            ->values()
            ->each(function (array $variant, int $index) use ($program) {
                $program->variants()->create([
                    'name' => $variant['name'],
                    'price' => $variant['price'] !== null && $variant['price'] !== '' ? (int) $variant['price'] : null,
                    'capacity' => $variant['capacity'] !== null && $variant['capacity'] !== '' ? (int) $variant['capacity'] : null,
                    'sort_order' => $index,
                ]);
            });
    }

    private function syncFacilities(SpecialProgram $program, array $facilities): void
    {
        $program->facilities()->delete();

        collect($facilities)
            ->filter(fn ($facility) => filled($facility))
            ->values()
            ->each(function (string $facility, int $index) use ($program) {
                $program->facilities()->create([
                    'content' => $facility,
                    'sort_order' => $index,
                ]);
            });
    }
}
