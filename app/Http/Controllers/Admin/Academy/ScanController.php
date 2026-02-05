<?php

namespace App\Http\Controllers\Admin\Academy;

use App\Http\Controllers\Controller;
use App\Models\AcademyClass;
use App\Models\AcademyScan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ScanController extends Controller
{
    public function index(Request $request): Response
    {
        $classId = $request->integer('class_id');
        $date = $request->string('date')->toString();

        $query = AcademyScan::query()->with(['booking.academyClass', 'ticket'])->latest('scanned_at');
        if ($classId) {
            $query->whereHas('booking', fn ($q) => $q->where('academy_class_id', $classId));
        }
        if ($date) {
            $query->whereDate('scanned_at', $date);
        }

        return Inertia::render('admin/academy/scans/index', [
            'scans' => $query->paginate(20)->withQueryString(),
            'classes' => AcademyClass::query()->select('id', 'title')->orderBy('title')->get(),
            'filters' => [
                'class_id' => $classId ?: null,
                'date' => $date,
            ],
        ]);
    }
}
