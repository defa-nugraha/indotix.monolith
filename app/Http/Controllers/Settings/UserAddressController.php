<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\UserAddress;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserAddressController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateAddress($request);
        $data['is_default'] = (bool) ($data['is_default'] ?? false);

        $address = $request->user()->addresses()->create($data);

        if ($data['is_default'] || $request->user()->addresses()->count() === 1) {
            $this->makeDefault($address);
        } else {
            $this->ensureDefault($request->user()->id);
        }

        return back();
    }

    public function update(Request $request, UserAddress $address): RedirectResponse
    {
        $this->authorizeAddress($request, $address);

        $data = $this->validateAddress($request);
        $data['is_default'] = (bool) ($data['is_default'] ?? false);

        $address->update($data);

        if ($data['is_default']) {
            $this->makeDefault($address);
        } else {
            $this->ensureDefault($request->user()->id);
        }

        return back();
    }

    public function destroy(Request $request, UserAddress $address): RedirectResponse
    {
        $this->authorizeAddress($request, $address);

        $userId = $address->user_id;
        $wasDefault = $address->is_default;
        $address->delete();

        if ($wasDefault) {
            $this->ensureDefault($userId);
        }

        return back();
    }

    public function setDefault(Request $request, UserAddress $address): RedirectResponse
    {
        $this->authorizeAddress($request, $address);
        $this->makeDefault($address);

        return back();
    }

    private function validateAddress(Request $request): array
    {
        $data = $request->validate([
            'label' => ['required', 'string', 'max:50'],
            'recipient_name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:30'],
            'address_line' => ['required', 'string', 'max:500'],
            'province_code' => ['nullable', 'string', 'size:2', 'exists:provinces,code'],
            'city_code' => ['nullable', 'string', 'size:4', 'exists:regencies,code'],
            'district_code' => ['nullable', 'string', 'size:6', 'exists:districts,code'],
            'village_code' => ['nullable', 'string', 'size:10', 'exists:villages,code'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'is_default' => ['nullable', 'boolean'],
        ]);

        $region = $this->resolveRegion($data);
        if ($region !== []) {
            $data = array_merge($data, $region);
        }

        return $data;
    }

    private function resolveRegion(array $data): array
    {
        $villageCode = $data['village_code'] ?? null;
        $districtCode = $data['district_code'] ?? null;
        $cityCode = $data['city_code'] ?? null;
        $provinceCode = $data['province_code'] ?? null;

        if ($villageCode) {
            $row = DB::table('villages')
                ->join('districts', 'villages.district_code', '=', 'districts.code')
                ->join('regencies', 'districts.regency_code', '=', 'regencies.code')
                ->join('provinces', 'regencies.province_code', '=', 'provinces.code')
                ->where('villages.code', $villageCode)
                ->first([
                    'villages.code as village_code',
                    'villages.name as village_name',
                    'districts.code as district_code',
                    'districts.name as district_name',
                    'regencies.code as city_code',
                    'regencies.name as city_name',
                    'provinces.code as province_code',
                    'provinces.name as province_name',
                ]);

            if ($row) {
                return [
                    'village_code' => $row->village_code,
                    'village' => $row->village_name,
                    'district_code' => $row->district_code,
                    'district' => $row->district_name,
                    'city_code' => $row->city_code,
                    'city' => $row->city_name,
                    'province_code' => $row->province_code,
                    'province' => $row->province_name,
                ];
            }
        }

        if ($districtCode) {
            $row = DB::table('districts')
                ->join('regencies', 'districts.regency_code', '=', 'regencies.code')
                ->join('provinces', 'regencies.province_code', '=', 'provinces.code')
                ->where('districts.code', $districtCode)
                ->first([
                    'districts.code as district_code',
                    'districts.name as district_name',
                    'regencies.code as city_code',
                    'regencies.name as city_name',
                    'provinces.code as province_code',
                    'provinces.name as province_name',
                ]);

            if ($row) {
                return [
                    'village_code' => null,
                    'village' => null,
                    'district_code' => $row->district_code,
                    'district' => $row->district_name,
                    'city_code' => $row->city_code,
                    'city' => $row->city_name,
                    'province_code' => $row->province_code,
                    'province' => $row->province_name,
                ];
            }
        }

        if ($cityCode) {
            $row = DB::table('regencies')
                ->join('provinces', 'regencies.province_code', '=', 'provinces.code')
                ->where('regencies.code', $cityCode)
                ->first([
                    'regencies.code as city_code',
                    'regencies.name as city_name',
                    'provinces.code as province_code',
                    'provinces.name as province_name',
                ]);

            if ($row) {
                return [
                    'village_code' => null,
                    'village' => null,
                    'district_code' => null,
                    'district' => null,
                    'city_code' => $row->city_code,
                    'city' => $row->city_name,
                    'province_code' => $row->province_code,
                    'province' => $row->province_name,
                ];
            }
        }

        if ($provinceCode) {
            $row = DB::table('provinces')
                ->where('provinces.code', $provinceCode)
                ->first([
                    'provinces.code as province_code',
                    'provinces.name as province_name',
                ]);

            if ($row) {
                return [
                    'village_code' => null,
                    'village' => null,
                    'district_code' => null,
                    'district' => null,
                    'city_code' => null,
                    'city' => null,
                    'province_code' => $row->province_code,
                    'province' => $row->province_name,
                ];
            }
        }

        return [
            'village_code' => null,
            'village' => null,
            'district_code' => null,
            'district' => null,
            'city_code' => null,
            'city' => null,
            'province_code' => null,
            'province' => null,
        ];
    }

    private function authorizeAddress(Request $request, UserAddress $address): void
    {
        if ($address->user_id !== $request->user()->id) {
            abort(403);
        }
    }

    private function makeDefault(UserAddress $address): void
    {
        UserAddress::query()
            ->where('user_id', $address->user_id)
            ->where('id', '!=', $address->id)
            ->update(['is_default' => false]);

        if (! $address->is_default) {
            $address->update(['is_default' => true]);
        }
    }

    private function ensureDefault(int $userId): void
    {
        $hasDefault = UserAddress::query()
            ->where('user_id', $userId)
            ->where('is_default', true)
            ->exists();

        if ($hasDefault) {
            return;
        }

        $fallback = UserAddress::query()
            ->where('user_id', $userId)
            ->orderByDesc('updated_at')
            ->first();

        if ($fallback) {
            $fallback->update(['is_default' => true]);
        }
    }
}
