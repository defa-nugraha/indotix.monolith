<?php

namespace App\Http\Controllers\Mitra\Wisata;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(Request $request): Response
    {
        $notifications = $request->user()
            ->notifications()
            ->latest()
            ->take(50)
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'title' => $item->data['title'] ?? 'Notifikasi',
                'message' => $item->data['message'] ?? '',
                'created_at' => $item->created_at->format('Y-m-d H:i'),
                'read_at' => $item->read_at,
            ]);

        return Inertia::render('mitra/wisata/notifications/index', [
            'notifications' => $notifications,
        ]);
    }
}
