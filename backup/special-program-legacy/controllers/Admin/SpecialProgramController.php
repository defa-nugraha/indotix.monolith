<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SpecialProgram;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SpecialProgramController extends Controller
{
    private const TYPE_OPTIONS = ['diskon', 'subsidi', 'bundling', 'highlight'];
    private const STATUS_OPTIONS = ['draft', 'scheduled', 'active', 'expired', 'suspended'];
    private const HIGHLIGHT_OPTIONS = ['low', 'medium', 'high'];

    public function index(Request $request, ?string $section = null): Response
    {
        $section = $section ?: 'programs';
        $programs = SpecialProgram::query()->latest()->get();
        $selectedId = $request->query('program') ? (int) $request->query('program') : $programs->first()?->id;
        $selected = $selectedId ? SpecialProgram::query()->find($selectedId) : null;

        return Inertia::render('admin/special-programs/index', [
            'section' => $section,
            'programs' => $programs->map(fn (SpecialProgram $program) => [
                'id' => $program->id,
                'name' => $program->name,
                'program_type' => $program->program_type,
                'status' => $program->status,
                'is_active' => (bool) $program->is_active,
                'starts_at' => $program->starts_at?->toDateString(),
                'ends_at' => $program->ends_at?->toDateString(),
                'priority' => $program->priority,
                'highlight_level' => $program->highlight_level,
            ]),
            'selectedProgram' => $selected ? [
                'id' => $selected->id,
                'name' => $selected->name,
                'program_type' => $selected->program_type,
                'description_internal' => $selected->description_internal,
                'starts_at' => $selected->starts_at?->toDateString(),
                'ends_at' => $selected->ends_at?->toDateString(),
                'status' => $selected->status,
                'is_active' => (bool) $selected->is_active,
                'scope' => $selected->scope ?? [],
                'rules' => $selected->rules ?? [],
                'discount' => $selected->discount ?? [],
                'visibility' => $selected->visibility ?? [],
                'budget' => $selected->budget ?? [],
                'compliance' => $selected->compliance ?? [],
                'terms' => $selected->terms,
                'priority' => $selected->priority,
                'highlight_level' => $selected->highlight_level,
            ] : null,
            'typeOptions' => self::TYPE_OPTIONS,
            'statusOptions' => self::STATUS_OPTIONS,
            'highlightOptions' => self::HIGHLIGHT_OPTIONS,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'program_type' => ['required', Rule::in(self::TYPE_OPTIONS)],
            'description_internal' => ['nullable', 'string'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'status' => ['nullable', Rule::in(self::STATUS_OPTIONS)],
            'is_active' => ['boolean'],
        ]);

        $data['status'] = $data['status'] ?? 'draft';
        $data['is_active'] = $request->boolean('is_active');
        $data['scope'] = [
            'mode' => 'all',
            'categories' => [],
            'locations' => [],
            'partners' => [],
            'events' => [],
        ];
        $data['rules'] = [
            'min_transaction' => 0,
            'max_quota' => 0,
            'per_user_limit' => 0,
            'stackable' => false,
        ];
        $data['discount'] = [
            'type' => $data['program_type'],
            'value' => 0,
            'platform_subsidy' => 0,
            'partner_subsidy' => 0,
            'max_cap' => 0,
        ];
        $data['visibility'] = [
            'placements' => ['special_section'],
            'priority' => 0,
            'highlight_level' => 'low',
            'push_enabled' => false,
            'tag_label' => 'Special Program',
        ];
        $data['budget'] = [
            'limit' => 0,
            'used' => 0,
        ];
        $data['compliance'] = [
            'partner_notification' => '',
            'partner_approval_required' => false,
            'legal_note' => '',
        ];
        $data['created_by'] = $request->user()?->id;
        $data['updated_by'] = $request->user()?->id;

        SpecialProgram::create($data);

        return back()->with('status', 'special-program-created');
    }

    public function update(Request $request, SpecialProgram $program): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'program_type' => ['sometimes', Rule::in(self::TYPE_OPTIONS)],
            'description_internal' => ['nullable', 'string'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'status' => ['sometimes', Rule::in(self::STATUS_OPTIONS)],
            'is_active' => ['sometimes', 'boolean'],
            'priority' => ['nullable', 'integer', 'min:0'],
            'highlight_level' => ['nullable', Rule::in(self::HIGHLIGHT_OPTIONS)],
            'scope' => ['nullable', 'array'],
            'rules' => ['nullable', 'array'],
            'discount' => ['nullable', 'array'],
            'visibility' => ['nullable', 'array'],
            'budget' => ['nullable', 'array'],
            'compliance' => ['nullable', 'array'],
            'terms' => ['nullable', 'string'],
        ]);

        if ($request->has('is_active')) {
            $data['is_active'] = $request->boolean('is_active');
        }

        $program->fill($data);
        $program->updated_by = $request->user()?->id;
        $program->save();

        return back()->with('status', 'special-program-updated');
    }

    public function duplicate(Request $request, SpecialProgram $program): RedirectResponse
    {
        $copy = $program->replicate();
        $copy->name = $program->name.' (Copy)';
        $copy->status = 'draft';
        $copy->is_active = false;
        $copy->created_by = $request->user()?->id;
        $copy->updated_by = $request->user()?->id;
        $copy->save();

        return back()->with('status', 'special-program-duplicated');
    }

    public function updateStatus(Request $request, SpecialProgram $program): RedirectResponse
    {
        $data = $request->validate([
            'action' => ['required', Rule::in(['activate', 'deactivate', 'suspend', 'resume', 'expire'])],
        ]);

        switch ($data['action']) {
            case 'activate':
                $program->status = 'active';
                $program->is_active = true;
                break;
            case 'deactivate':
                $program->is_active = false;
                if ($program->status === 'active') {
                    $program->status = 'suspended';
                }
                break;
            case 'suspend':
                $program->status = 'suspended';
                $program->is_active = false;
                break;
            case 'resume':
                $program->status = 'active';
                $program->is_active = true;
                break;
            case 'expire':
                $program->status = 'expired';
                $program->is_active = false;
                break;
        }

        $program->updated_by = $request->user()?->id;
        $program->save();

        return back()->with('status', 'special-program-status-updated');
    }

    public function destroy(SpecialProgram $program): RedirectResponse
    {
        $program->delete();

        return back()->with('status', 'special-program-deleted');
    }
}
