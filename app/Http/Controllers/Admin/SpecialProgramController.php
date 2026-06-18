<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SpecialProgram;
use App\Models\SpecialProgramVariant;
use App\Models\User;
use App\Support\AdminDataScope;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SpecialProgramController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->string('status')->toString();
        $category = $request->string('category')->toString();
        $query = AdminDataScope::applyCreatedBy(SpecialProgram::query()->latest(), $request);
        if ($status) {
            $query->where('is_active', $status === 'published');
        }
        if ($category) {
            $query->where('category', $category);
        }

        return Inertia::render('admin/special-programs/index', [
            'programs' => $query->paginate(\App\Support\PaginationOptions::perPage())->withQueryString(),
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
            'adminOptions' => $this->adminOptions(),
            'canChooseAdmin' => request()->user()?->role === 'admin',
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
                'capacity' => isset($data['capacity']) ? (int) $data['capacity'] : 0,
                'is_active' => (bool) ($data['is_active'] ?? false),
                'status' => ($data['is_active'] ?? false) ? 'published' : 'draft',
                'created_by' => $this->resolveSpecialAdminId($request, $data['created_by'] ?? null),
                'updated_by' => $request->user()?->id,
            ]);

            if ($request->hasFile('image')) {
                $program->image_path = $request->file('image')->store('special-programs', 'public');
            }

            $program->save();
            $this->syncVariants($program, $data['variants'] ?? []);
            $this->syncFacilities($program, $data['facilities'] ?? []);
            $this->syncInventories($program, $data['inventories'] ?? [], $data['category'] ?? null);

            return redirect()
                ->route('admin.special-programs.show', $program)
                ->with('status', 'special-program-created');
        });
    }

    public function edit(SpecialProgram $program): Response
    {
        AdminDataScope::authorizeCreatedBy($program, request());

        $program->load(['variants.facilities', 'facilities', 'inventories']);

        return Inertia::render('admin/special-programs/create', [
            'program' => [
                'id' => $program->id,
                'created_by' => $program->created_by,
                'name' => $program->name,
                'category' => $program->category,
                'description' => $program->description,
                'base_price' => $program->base_price,
                'capacity' => $program->capacity ?? 0,
                'is_active' => $program->is_active,
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
            'adminOptions' => $this->adminOptions(),
            'canChooseAdmin' => request()->user()?->role === 'admin',
        ]);
    }

    public function update(Request $request, SpecialProgram $program): RedirectResponse
    {
        AdminDataScope::authorizeCreatedBy($program, $request);

        $data = $this->validateProgram($request, false);

        return DB::transaction(function () use ($request, $program, $data) {
            $program->fill([
                'name' => $data['name'],
                'program_type' => 'package',
                'category' => $data['category'],
                'description' => $data['description'] ?? null,
                'base_price' => (int) ($data['base_price'] ?? 0),
                'capacity' => isset($data['capacity']) ? (int) $data['capacity'] : 0,
                'is_active' => (bool) ($data['is_active'] ?? false),
                'status' => ($data['is_active'] ?? false) ? 'published' : 'draft',
                'updated_by' => $request->user()?->id,
            ]);

            if ($request->user()?->role === 'admin') {
                $program->created_by = $this->resolveSpecialAdminId($request, $data['created_by'] ?? null);
            }

            if ($request->hasFile('image')) {
                if ($program->image_path) {
                    Storage::disk('public')->delete($program->image_path);
                }
                $program->image_path = $request->file('image')->store('special-programs', 'public');
            }

            $program->save();
            $this->syncVariants($program, $data['variants'] ?? []);
            $this->syncFacilities($program, $data['facilities'] ?? []);
            $this->syncInventories($program, $data['inventories'] ?? [], $data['category'] ?? null);

            return back()->with('status', 'special-program-updated');
        });
    }

    public function show(SpecialProgram $program): Response
    {
        AdminDataScope::authorizeCreatedBy($program, request());

        $program->load(['variants.facilities', 'facilities', 'inventories']);

        return Inertia::render('admin/special-programs/show', [
            'program' => [
                'id' => $program->id,
                'created_by' => $program->created_by,
                'name' => $program->name,
                'category' => $program->category,
                'description' => $program->description,
                'base_price' => $program->base_price,
                'capacity' => $program->capacity ?? 0,
                'is_active' => $program->is_active,
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

    public function destroy(SpecialProgram $program): RedirectResponse
    {
        AdminDataScope::authorizeCreatedBy($program, request());

        if ($program->image_path) {
            Storage::disk('public')->delete($program->image_path);
        }
        $program->delete();

        return redirect()->route('admin.special-programs.index');
    }

    public function updateStatus(Request $request, SpecialProgram $program): RedirectResponse
    {
        AdminDataScope::authorizeCreatedBy($program, $request);

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
            'variants.*.facilities' => ['nullable', 'array'],
            'variants.*.facilities.*' => ['nullable', 'string', 'max:255'],
            'facilities' => ['nullable', 'array'],
            'facilities.*' => ['nullable', 'string', 'max:255'],
            'inventories' => ['nullable', 'array'],
            'inventories.*.date' => ['required_with:inventories', 'date'],
            'inventories.*.capacity' => ['nullable', 'integer', 'min:0'],
            'created_by' => [
                'nullable',
                'integer',
                Rule::exists('users', 'id')->where('role', 'admin_special_program'),
            ],
        ]);
    }

    private function adminOptions(): array
    {
        return User::query()
            ->where('role', 'admin_special_program')
            ->orderBy('name')
            ->get(['id', 'name', 'email'])
            ->map(fn (User $user) => [
                'value' => $user->id,
                'label' => trim($user->name.' - '.$user->email, ' -'),
            ])
            ->all();
    }

    private function resolveSpecialAdminId(Request $request, mixed $selectedId): ?int
    {
        if ($request->user()?->role === 'admin_special_program') {
            return $request->user()->id;
        }

        return filled($selectedId) ? (int) $selectedId : null;
    }

    private function syncVariants(SpecialProgram $program, array $variants): void
    {
        $program->variants()->delete();

        collect($variants)
            ->filter(fn ($variant) => filled($variant['name'] ?? null))
            ->values()
            ->each(function (array $variant, int $index) use ($program) {
                $created = $program->variants()->create([
                    'name' => $variant['name'],
                    'price' => $this->normalizeNullableInteger($variant['price'] ?? null),
                    'capacity' => isset($variant['capacity']) ? (int) $variant['capacity'] : 0,
                    'sort_order' => $index,
                ]);

                $this->syncVariantFacilities($created, $variant['facilities'] ?? []);
            });
    }

    private function syncVariantFacilities(SpecialProgramVariant $variant, array $facilities): void
    {
        $variant->facilities()->delete();

        collect($facilities)
            ->filter(fn ($facility) => filled($facility))
            ->values()
            ->each(function (string $facility, int $index) use ($variant) {
                $variant->facilities()->create([
                    'content' => $facility,
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

    private function syncInventories(
        SpecialProgram $program,
        array $inventories,
        ?string $category,
    ): void {
        if ($category !== 'travel') {
            $program->inventories()->delete();
            return;
        }

        $program->inventories()->delete();

        collect($inventories)
            ->filter(fn ($inventory) => filled($inventory['date'] ?? null))
            ->unique('date')
            ->values()
            ->each(function (array $inventory) use ($program) {
                $program->inventories()->create([
                    'date' => $inventory['date'],
                    'capacity' => isset($inventory['capacity']) ? (int) $inventory['capacity'] : 0,
                ]);
            });
    }

    private function normalizeNullableInteger(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        return (int) $value;
    }
}
