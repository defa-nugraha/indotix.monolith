<?php

namespace App\Http\Controllers\Admin\Academy;

use App\Http\Controllers\Controller;
use App\Models\AcademyAuditLog;
use App\Models\AcademyClass;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClassController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->string('status')->toString();
        $query = AcademyClass::query()->latest('id');
        if ($status) {
            $query->where('status', $status);
        }

        return Inertia::render('admin/academy/classes/index', [
            'classes' => $query->paginate(20)->withQueryString(),
            'filters' => ['status' => $status],
        ]);
    }

    public function show(AcademyClass $class): Response
    {
        $class->load('tickets');

        return Inertia::render('admin/academy/classes/show', [
            'class' => $class,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category' => ['nullable', 'string', 'max:255'],
            'start_at' => ['required', 'date'],
            'end_at' => ['required', 'date', 'after_or_equal:start_at'],
            'duration_minutes' => ['required', 'integer', 'min:0'],
            'location_type' => ['required', 'in:offline,online,hybrid'],
            'location_detail' => ['nullable', 'string', 'max:255'],
            'capacity_total' => ['required', 'integer', 'min:0'],
            'status' => ['required', 'in:draft,scheduled,open_for_sale,closed,completed,cancelled'],
            'is_active' => ['required', 'boolean'],
        ]);

        $class = AcademyClass::create($data);

        AcademyAuditLog::create([
            'admin_id' => $request->user()->id,
            'action' => 'academy_class_created',
            'subject_type' => AcademyClass::class,
            'subject_id' => $class->id,
            'metadata' => $data,
        ]);

        return back()->with('status', 'class-created');
    }

    public function update(Request $request, AcademyClass $class): RedirectResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category' => ['nullable', 'string', 'max:255'],
            'start_at' => ['required', 'date'],
            'end_at' => ['required', 'date', 'after_or_equal:start_at'],
            'duration_minutes' => ['required', 'integer', 'min:0'],
            'location_type' => ['required', 'in:offline,online,hybrid'],
            'location_detail' => ['nullable', 'string', 'max:255'],
            'capacity_total' => ['required', 'integer', 'min:0'],
            'status' => ['required', 'in:draft,scheduled,open_for_sale,closed,completed,cancelled'],
            'is_active' => ['required', 'boolean'],
        ]);

        $class->update($data);

        AcademyAuditLog::create([
            'admin_id' => $request->user()->id,
            'action' => 'academy_class_updated',
            'subject_type' => AcademyClass::class,
            'subject_id' => $class->id,
            'metadata' => $data,
        ]);

        return back()->with('status', 'class-updated');
    }
}
