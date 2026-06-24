<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SouvenirAuditLog;
use App\Models\SouvenirCategory;
use App\Support\AdminDataScope;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SouvenirCategoryController extends Controller
{
    public function index(): Response
    {
        $categories = AdminDataScope::applyCreatedBy(SouvenirCategory::query(), request())
            ->with('parent:id,name')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/souvenir/categories/index', [
            'categories' => $categories,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'parent_id' => ['nullable', 'exists:souvenir_categories,id'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $category = SouvenirCategory::create([
            'name' => $data['name'],
            'parent_id' => $data['parent_id'] ?? null,
            'sort_order' => $data['sort_order'] ?? 0,
            'is_active' => (bool) ($data['is_active'] ?? true),
            'created_by' => $request->user()->id,
            'updated_by' => $request->user()->id,
        ]);

        $this->logAudit($request, 'category_created', 'Kategori souvenir dibuat.', [
            'category_id' => $category->id,
            'name' => $category->name,
        ]);

        return back()->with('status', 'souvenir-category-created');
    }

    public function update(Request $request, SouvenirCategory $category): RedirectResponse
    {
        AdminDataScope::authorizeCreatedBy($category, $request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'parent_id' => ['nullable', 'exists:souvenir_categories,id'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $category->update([
            'name' => $data['name'],
            'parent_id' => $data['parent_id'] ?? null,
            'sort_order' => $data['sort_order'] ?? 0,
            'is_active' => (bool) ($data['is_active'] ?? true),
            'updated_by' => $request->user()->id,
        ]);

        $this->logAudit($request, 'category_updated', 'Kategori souvenir diperbarui.', [
            'category_id' => $category->id,
        ]);

        return back()->with('status', 'souvenir-category-updated');
    }

    public function destroy(Request $request, SouvenirCategory $category): RedirectResponse
    {
        AdminDataScope::authorizeCreatedBy($category, $request);

        $category->delete();

        $this->logAudit($request, 'category_deleted', 'Kategori souvenir dihapus.', [
            'category_id' => $category->id,
        ]);

        return back()->with('status', 'souvenir-category-deleted');
    }

    private function logAudit(Request $request, string $action, string $description, array $data = []): void
    {
        SouvenirAuditLog::create([
            'action' => $action,
            'description' => $description,
            'data' => $data,
            'created_by' => $request->user()->id,
        ]);
    }
}
