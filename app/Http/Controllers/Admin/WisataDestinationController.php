<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MitraWisataOnboarding;
use App\Models\Regency;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class WisataDestinationController extends Controller
{
    public function index(Request $request): Response
    {
        $query = MitraWisataOnboarding::query()
            ->with(['user:id,name,email']);

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($builder) use ($search) {
                $builder->where('destination_name', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($userQuery) => $userQuery->where('name', 'like', "%{$search}%"));
            });
        }

        if ($status = $request->string('status')->toString()) {
            $query->where('verification_status', $status);
        }

        if ($city = $request->string('city')->toString()) {
            $query->where('city_code', $city);
        }

        $destinations = $query->latest('id')
            ->paginate(10)
            ->withQueryString()
            ->through(function (MitraWisataOnboarding $item) {
                return [
                    'id' => $item->id,
                    'destination_name' => $item->destination_name,
                    'destination_type' => $item->destination_type,
                    'city_code' => $item->city_code,
                    'verification_status' => $item->verification_status,
                    'is_live' => $item->is_live,
                    'is_suspended' => $item->is_suspended,
                    'user' => [
                        'id' => $item->user?->id,
                        'name' => $item->user?->name,
                        'email' => $item->user?->email,
                    ],
                ];
            });

        $cities = Regency::query()
            ->orderBy('name')
            ->get(['code', 'name'])
            ->map(fn ($item) => ['id' => $item->code, 'label' => $item->name])
            ->all();

        return Inertia::render('admin/wisata/destinations/index', [
            'destinations' => $destinations,
            'cities' => $cities,
            'filters' => [
                'search' => $request->string('search')->toString(),
                'status' => $request->string('status')->toString(),
                'city' => $request->string('city')->toString(),
            ],
        ]);
    }

    public function show(MitraWisataOnboarding $destination): Response
    {
        $destination->load(['user:id,name,email']);

        $provinces = DB::table('provinces')
            ->orderBy('name')
            ->get(['code', 'name'])
            ->map(fn ($item) => ['id' => $item->code, 'label' => $item->name])
            ->all();

        $cities = Regency::query()
            ->orderBy('name')
            ->get(['code', 'name'])
            ->map(fn ($item) => ['id' => $item->code, 'label' => $item->name])
            ->all();

        return Inertia::render('admin/wisata/destinations/show', [
            'destination' => $destination,
            'cityName' => Regency::query()->where('code', $destination->city_code)->value('name'),
            'provinces' => $provinces,
            'cities' => $cities,
        ]);
    }

    public function update(Request $request, MitraWisataOnboarding $destination): RedirectResponse
    {
        $data = $request->validate([
            'destination_name' => ['required', 'string', 'max:255'],
            'destination_type' => ['required', 'in:alam,edukasi,budaya,wahana,event'],
            'description' => ['nullable', 'string', 'max:1000'],
            'highlights' => ['nullable', 'string', 'max:1000'],
            'province_code' => ['nullable', 'exists:provinces,code'],
            'city_code' => ['nullable', 'exists:regencies,code'],
            'address_full' => ['nullable', 'string', 'max:500'],
            'maps_pin_url' => ['nullable', 'string', 'max:500'],
            'open_days' => ['nullable', 'array'],
            'open_days.*' => ['string'],
            'open_time' => ['nullable', 'string', 'max:8'],
            'close_time' => ['nullable', 'string', 'max:8'],
            'holiday_notes' => ['nullable', 'string', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:50'],
            'contact_hours' => ['nullable', 'string', 'max:100'],
            'is_live' => ['nullable', 'boolean'],
        ]);

        $destination->update($data);

        return back()->with('status', 'destination-updated');
    }

    public function suspend(Request $request, MitraWisataOnboarding $destination): RedirectResponse
    {
        $data = $request->validate([
            'action' => ['required', 'in:suspend,unsuspend'],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        if ($data['action'] === 'suspend') {
            $destination->update([
                'is_suspended' => true,
                'suspended_reason' => $data['reason'],
                'suspended_at' => now(),
            ]);
        } else {
            $destination->update([
                'is_suspended' => false,
                'suspended_reason' => null,
                'suspended_at' => null,
            ]);
        }

        return back()->with('status', 'destination-suspended');
    }
}
