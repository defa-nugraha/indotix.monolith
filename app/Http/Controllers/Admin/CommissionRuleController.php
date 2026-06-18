<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CommissionRule;
use App\Models\Hotel;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CommissionRuleController extends Controller
{
    public function index(): Response
    {
        $rules = CommissionRule::query()
            ->with(['hotel', 'createdBy:id,name', 'updatedBy:id,name'])
            ->latest()
            ->get()
            ->map(fn (CommissionRule $rule) => [
                'id' => $rule->id,
                'hotel_id' => $rule->hotel_id,
                'hotel_name' => $rule->hotel?->name,
                'type' => $rule->type,
                'value' => $rule->value,
                'starts_at' => $rule->starts_at?->toDateString(),
                'ends_at' => $rule->ends_at?->toDateString(),
                'is_forever' => $rule->is_forever,
                'is_active' => $rule->is_active,
                'created_by_name' => $rule->createdBy?->name,
                'updated_by_name' => $rule->updatedBy?->name,
            ]);

        return Inertia::render('admin/finance/commissions/index', [
            'rules' => $rules,
            'hotelOptions' => $this->hotelOptions(),
            'typeOptions' => ['percentage', 'fixed'],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateRule($request);
        CommissionRule::create($data);

        return back()->with('status', 'commission-created');
    }

    public function update(Request $request, CommissionRule $commissionRule): RedirectResponse
    {
        $data = $this->validateRule($request);
        $commissionRule->update($data);

        return back()->with('status', 'commission-updated');
    }

    public function destroy(CommissionRule $commissionRule): RedirectResponse
    {
        $commissionRule->delete();

        return back()->with('status', 'commission-deleted');
    }

    private function validateRule(Request $request): array
    {
        $data = $request->validate([
            'hotel_id' => ['nullable', 'integer', 'exists:hotels,id'],
            'type' => ['required', Rule::in(['percentage', 'fixed'])],
            'value' => ['required', 'numeric', 'min:0'],
            'is_forever' => ['boolean'],
            'starts_at' => [Rule::requiredIf(fn () => ! $request->boolean('is_forever')), 'nullable', 'date'],
            'ends_at' => [Rule::requiredIf(fn () => ! $request->boolean('is_forever')), 'nullable', 'date', 'after_or_equal:starts_at'],
            'is_active' => ['boolean'],
        ]);

        $data['is_forever'] = $request->boolean('is_forever');
        $data['is_active'] = $request->boolean('is_active', true);

        if ($data['is_forever']) {
            $data['starts_at'] = null;
            $data['ends_at'] = null;
        }

        return $data;
    }

    private function hotelOptions(): array
    {
        return Hotel::query()
            ->select('id', 'name')
            ->orderBy('name')
            ->get()
            ->map(fn (Hotel $hotel) => [
                'id' => $hotel->id,
                'label' => $hotel->name,
            ])
            ->all();
    }
}
