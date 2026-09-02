<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $perPage = (int) $request->query('per_page', 20);
        $perPage = max(1, min($perPage, 100));

        $query = $this->tourismNotificationQuery((int) $user->id);

        $status = $request->query('status');
        if ($status === 'unread') {
            $query->where('is_read', false);
        } elseif ($status === 'read') {
            $query->where('is_read', true);
        }

        $type = $request->query('type');
        if ($type) {
            $types = array_filter(array_map('trim', explode(',', (string) $type)));
            if ($types) {
                $query->whereIn('type', $types);
            }
        }

        $keyword = $request->query('q');
        if ($keyword) {
            $query->where(function ($builder) use ($keyword) {
                $builder
                    ->where('title', 'like', '%' . $keyword . '%')
                    ->orWhere('message', 'like', '%' . $keyword . '%');
            });
        }

        $notifications = $query
            ->orderByDesc('id')
            ->paginate($perPage);

        $unreadCount = $this->unreadCountForUser((int) $user->id);

        return response()->json([
            'filters' => [
                'status' => $status,
                'type' => $type,
                'q' => $keyword,
            ],
            'meta' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
                'unread_count' => $unreadCount,
            ],
            'notifications' => $notifications->getCollection()->map(fn (UserNotification $notification) => [
                'id' => $notification->id,
                'title' => $notification->title,
                'message' => $notification->message,
                'type' => $notification->type,
                'is_read' => $notification->is_read,
                'data' => $notification->data,
                'created_at' => $notification->created_at?->toIso8601String(),
            ]),
        ]);
    }

    public function markRead(Request $request, UserNotification $notification): JsonResponse
    {
        if ((int) $notification->user_id !== (int) $request->user()->id) {
            abort(403);
        }

        $notification->update(['is_read' => true]);

        return response()->json([
            'notification' => [
                'id' => $notification->id,
                'title' => $notification->title,
                'message' => $notification->message,
                'type' => $notification->type,
                'is_read' => $notification->is_read,
                'data' => $notification->data,
                'created_at' => $notification->created_at?->toIso8601String(),
            ],
        ]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $updated = UserNotification::query()
            ->where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json([
            'updated' => $updated,
            'unread_count' => 0,
        ]);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        $count = $this->unreadCountForUser((int) $request->user()->id);

        return response()->json([
            'unread_count' => $count,
        ]);
    }

    private function unreadCountForUser(int $userId): int
    {
        return UserNotification::query()
            ->where('user_id', $userId)
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
            ->where('is_read', false)
            ->count();
    }

    private function tourismNotificationQuery(int $userId)
    {
        return UserNotification::query()
            ->where('user_id', $userId)
            ->where(function ($query) {
                $query->where('type', 'like', 'wisata_%')
                    ->orWhere(function ($query) {
                        $query->where('type', 'not like', 'event_%')
                            ->where('type', 'not like', 'hotel_%')
                            ->where('type', 'not like', 'souvenir_%')
                            ->where('type', 'not like', 'academy_%')
                            ->where('type', 'not like', 'special_program_%');
                    });
            });
    }
}
