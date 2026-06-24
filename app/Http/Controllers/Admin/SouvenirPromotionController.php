<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SouvenirAuditLog;
use App\Models\SouvenirPromotion;
use App\Models\SpecialProgram;
use App\Support\AdminDataScope;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SouvenirPromotionController extends Controller
{
    public function index(): Response
    {
        $promotions = AdminDataScope::applyCreatedBy(SouvenirPromotion::query(), request())->latest()->get();
        $programs = SpecialProgram::query()->orderBy('name')->get(['id', 'name']);

        return Inertia::render('admin/souvenir/promotions/index', [
            'promotions' => $promotions,
            'programs' => $programs,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:discount,bundling,special_program'],
            'value' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date'],
            'rules' => ['nullable', 'array'],
            'special_program_id' => ['nullable', 'exists:special_programs,id'],
        ]);

        $promotion = SouvenirPromotion::create([
            'name' => $data['name'],
            'type' => $data['type'],
            'value' => $data['value'] ?? null,
            'is_active' => (bool) ($data['is_active'] ?? false),
            'starts_at' => $data['starts_at'] ?? null,
            'ends_at' => $data['ends_at'] ?? null,
            'rules' => $data['rules'] ?? null,
            'special_program_id' => $data['special_program_id'] ?? null,
            'created_by' => $request->user()->id,
            'updated_by' => $request->user()->id,
        ]);

        $this->logAudit($request, 'promotion_created', 'Promo souvenir dibuat.', [
            'promotion_id' => $promotion->id,
        ]);

        return back()->with('status', 'souvenir-promotion-created');
    }

    public function update(Request $request, SouvenirPromotion $promotion): RedirectResponse
    {
        AdminDataScope::authorizeCreatedBy($promotion, $request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:discount,bundling,special_program'],
            'value' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date'],
            'rules' => ['nullable', 'array'],
            'special_program_id' => ['nullable', 'exists:special_programs,id'],
        ]);

        $promotion->update([
            'name' => $data['name'],
            'type' => $data['type'],
            'value' => $data['value'] ?? null,
            'is_active' => (bool) ($data['is_active'] ?? false),
            'starts_at' => $data['starts_at'] ?? null,
            'ends_at' => $data['ends_at'] ?? null,
            'rules' => $data['rules'] ?? null,
            'special_program_id' => $data['special_program_id'] ?? null,
            'updated_by' => $request->user()->id,
        ]);

        $this->logAudit($request, 'promotion_updated', 'Promo souvenir diperbarui.', [
            'promotion_id' => $promotion->id,
        ]);

        return back()->with('status', 'souvenir-promotion-updated');
    }

    public function destroy(Request $request, SouvenirPromotion $promotion): RedirectResponse
    {
        AdminDataScope::authorizeCreatedBy($promotion, $request);

        $promotion->delete();

        $this->logAudit($request, 'promotion_deleted', 'Promo souvenir dihapus.', [
            'promotion_id' => $promotion->id,
        ]);

        return back()->with('status', 'souvenir-promotion-deleted');
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
