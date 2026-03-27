<?php

namespace App\Http\Controllers;

use App\Models\SpecialProgram;
use App\Models\SpecialProgramBooking;
use App\Models\SpecialProgramVariant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class SpecialProgramBookingController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        if (! $request->user()) {
            return redirect()->route('login');
        }

        if ($request->user()->role !== 'user') {
            return redirect()->route('home');
        }

        $data = $request->validate([
            'program_id' => ['required', 'integer', 'exists:special_programs,id'],
            'variant_id' => ['nullable', 'integer', 'exists:special_program_variants,id'],
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:30'],
            'date' => ['required', 'date'],
            'pax' => ['required', 'integer', 'min:1', 'max:999'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $program = SpecialProgram::query()
            ->where('id', $data['program_id'])
            ->where('is_active', true)
            ->firstOrFail();

        $variant = null;
        if ($data['variant_id'] ?? null) {
            $variant = SpecialProgramVariant::query()
                ->where('id', $data['variant_id'])
                ->where('special_program_id', $program->id)
                ->first();

            if (! $variant) {
                return back()->withErrors(['variant_id' => 'Variant tidak sesuai paket.']);
            }
        }

        $unitPrice = $variant?->price ?? $program->base_price;
        $totalPrice = (int) $unitPrice * (int) $data['pax'];

        SpecialProgramBooking::create([
            'user_id' => $request->user()->id,
            'special_program_id' => $program->id,
            'special_program_variant_id' => $variant?->id,
            'item_type' => 'package',
            'item_id' => $program->id,
            'item_name' => $program->name,
            'visit_date' => $data['date'],
            'quantity' => $data['pax'],
            'unit_price' => $unitPrice,
            'total_price' => $totalPrice,
            'status' => 'pending',
            'guest_name' => $data['name'],
            'guest_email' => $request->user()->email,
            'guest_phone' => $data['phone'],
            'notes' => $data['notes'] ?? null,
        ]);

        return back()->with('status', 'special-program-booked');
    }
}
