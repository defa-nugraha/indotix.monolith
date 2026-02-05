<?php

namespace App\Http\Controllers\Admin\Academy;

use App\Http\Controllers\Controller;
use App\Models\AcademyAuditLog;
use App\Models\AcademyClass;
use App\Models\AcademyClassImage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ClassController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->string('status')->toString();
        $query = AcademyClass::query()->with('images')->latest('id');
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
        $class->load('tickets', 'images');

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
            'images' => ['nullable', 'array', 'max:5'],
            'images.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ]);

        $class = AcademyClass::create($data);
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store("academy/classes/{$class->id}", 'public');
                AcademyClassImage::create([
                    'academy_class_id' => $class->id,
                    'image_path' => $path,
                ]);
            }
        }

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
            'images' => ['nullable', 'array', 'max:5'],
            'images.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ]);

        $class->update($data);
        if ($request->hasFile('images')) {
            $existingCount = $class->images()->count();
            $incoming = count($request->file('images'));
            if ($existingCount + $incoming > 5) {
                return back()->withErrors([
                    'images' => 'Maksimal 5 gambar per kelas.',
                ]);
            }
            foreach ($request->file('images') as $image) {
                $path = $image->store("academy/classes/{$class->id}", 'public');
                AcademyClassImage::create([
                    'academy_class_id' => $class->id,
                    'image_path' => $path,
                ]);
            }
        }

        AcademyAuditLog::create([
            'admin_id' => $request->user()->id,
            'action' => 'academy_class_updated',
            'subject_type' => AcademyClass::class,
            'subject_id' => $class->id,
            'metadata' => $data,
        ]);

        return back()->with('status', 'class-updated');
    }

    public function destroyImage(Request $request, AcademyClass $class, AcademyClassImage $image): RedirectResponse
    {
        if ($image->academy_class_id !== $class->id) {
            abort(404);
        }

        Storage::disk('public')->delete($image->image_path);
        $image->delete();

        return back()->with('status', 'image-deleted');
    }
}
