<?php

namespace App\Http\Controllers\Admin\Academy;

use App\Http\Controllers\Controller;
use App\Models\AcademyBooking;
use App\Models\AcademyClass;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function index(): Response
    {
        $classes = AcademyClass::query()->withCount(['bookings'])->latest('id')->get();
        $paid = AcademyBooking::query()->whereIn('status', ['paid', 'completed'])->get();

        return Inertia::render('admin/academy/reports/index', [
            'summary' => [
                'classes' => $classes->count(),
                'bookings' => $paid->count(),
                'gross' => $paid->sum('total_price'),
            ],
            'classes' => $classes,
        ]);
    }
}
