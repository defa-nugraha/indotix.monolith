<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RegionController extends Controller
{
    public function villages(Request $request): JsonResponse
    {
        $search = trim($request->string('search')->toString());
        $districtCode = trim($request->string('district_code')->toString());
        $cityCode = trim($request->string('city_code')->toString());
        $provinceCode = trim($request->string('province_code')->toString());

        $length = function_exists('mb_strlen') ? mb_strlen($search) : strlen($search);
        $hasSearch = $length >= 2;
        if (! $hasSearch && $districtCode === '') {
            return response()->json([]);
        }

        $query = DB::table('villages')
            ->join('districts', 'villages.district_code', '=', 'districts.code')
            ->join('regencies', 'districts.regency_code', '=', 'regencies.code')
            ->join('provinces', 'regencies.province_code', '=', 'provinces.code');

        if ($districtCode !== '') {
            $query->where('districts.code', $districtCode);
        }

        if ($cityCode !== '') {
            $query->where('regencies.code', $cityCode);
        }

        if ($provinceCode !== '') {
            $query->where('provinces.code', $provinceCode);
        }

        $villages = $query
            ->when($hasSearch, function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('villages.name', 'like', "%{$search}%")
                        ->orWhere('districts.name', 'like', "%{$search}%")
                        ->orWhere('regencies.name', 'like', "%{$search}%")
                        ->orWhere('provinces.name', 'like', "%{$search}%");
                });
            })
            ->orderBy('villages.name')
            ->limit(25)
            ->get([
                'villages.code as village_code',
                'villages.name as village_name',
                'villages.type as village_type',
                'districts.code as district_code',
                'districts.name as district_name',
                'regencies.code as city_code',
                'regencies.name as regency_name',
                'regencies.type as regency_type',
                'provinces.code as province_code',
                'provinces.name as province_name',
            ])
            ->map(function ($row) {
                $villageLabel = trim(sprintf('%s%s', $row->village_type ? "{$row->village_type} " : '', $row->village_name));
                $regencyLabel = trim(sprintf('%s %s', $row->regency_type ?? 'Kabupaten', $row->regency_name));

                return [
                    'value' => $row->village_code,
                    'label' => sprintf('%s, Kec. %s, %s, Prov. %s', $villageLabel, $row->district_name, $regencyLabel, $row->province_name),
                    'district_code' => $row->district_code,
                    'city_code' => $row->city_code,
                    'province_code' => $row->province_code,
                ];
            })
            ->all();

        return response()->json($villages);
    }
}
