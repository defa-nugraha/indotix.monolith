<?php

namespace App\Http\Controllers\Mitra\Event;

use App\Http\Controllers\Controller;
use App\Models\UserNotification;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(Request $request): Response
    {
        $notifications = UserNotification::query()
            ->where('user_id', $request->user()->id)
            ->latest()
            ->take(50)
            ->get()
            ->map(fn (UserNotification $item) => [
                'id' => $item->id,
                'title' => $item->title ?? 'Notifikasi',
                'message' => $item->message ?? '',
                'created_at' => $item->created_at?->format('Y-m-d H:i'),
                'read_at' => $item->is_read ? $item->updated_at?->format('Y-m-d H:i') : null,
            ]);

        return Inertia::render('mitra/events/notifications/index', [
            'notifications' => $notifications,
        ]);
    }
}
