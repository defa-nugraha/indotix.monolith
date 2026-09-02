<?php

namespace App\Http\Controllers;

use App\Models\UserNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PublicNotificationController extends Controller
{
    public function index(Request $request): Response
    {
        $notifications = UserNotification::query()
            ->where('user_id', $request->user()->id)
            ->where(function ($query) {
                $query->where('type', 'like', 'wisata_%')
                    ->orWhere(function ($query) {
                        $query->where('type', 'not like', 'event_%')
                            ->where('type', 'not like', 'hotel_%')
                            ->where('type', 'not like', 'souvenir_%')
                            ->where('type', 'not like', 'academy_%')
                            ->where('type', 'not like', 'special_program_%');
                    });
            })
            ->latest()
            ->get()
            ->map(fn (UserNotification $notification) => [
                'id' => $notification->id,
                'title' => $notification->title,
                'message' => $notification->message,
                'type' => $notification->type,
                'is_read' => $notification->is_read,
                'data' => $notification->data,
                'created_at' => $notification->created_at?->toIso8601String(),
            ]);

        return Inertia::render('public/notifications', [
            'notifications' => $notifications,
        ]);
    }

    public function markRead(Request $request, UserNotification $notification): RedirectResponse
    {
        if ((int) $notification->user_id !== (int) $request->user()->id) {
            return redirect()->route('home');
        }

        $notification->update(['is_read' => true]);

        return back();
    }

    public function markAllRead(Request $request): RedirectResponse
    {
        UserNotification::query()
            ->where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return back();
    }
}
