<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserNotification;
use App\Services\PushNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminNotificationController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user || $user->role !== 'admin') {
            return response()->json([
                'message' => 'Forbidden.',
            ], 403);
        }

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:1000'],
            'type' => ['required', 'string', 'max:50'],
            'target' => ['nullable', Rule::in(['all', 'roles', 'users'])],
            'roles' => ['nullable', 'array'],
            'roles.*' => ['string', 'max:50'],
            'user_ids' => ['nullable', 'array'],
            'user_ids.*' => ['integer', 'exists:users,id'],
            'data' => ['nullable', 'array'],
        ]);

        $target = $data['target'] ?? null;
        $roles = $data['roles'] ?? [];
        $userIds = $data['user_ids'] ?? [];

        if (! $target) {
            if ($userIds) {
                $target = 'users';
            } elseif ($roles) {
                $target = 'roles';
            } else {
                $target = 'roles';
                $roles = ['user'];
            }
        }

        if ($target === 'roles' && ! $roles) {
            return response()->json([
                'message' => 'Roles wajib diisi.',
                'errors' => [
                    'roles' => ['Roles wajib diisi.'],
                ],
            ], 422);
        }

        if ($target === 'users' && ! $userIds) {
            return response()->json([
                'message' => 'User ids wajib diisi.',
                'errors' => [
                    'user_ids' => ['User ids wajib diisi.'],
                ],
            ], 422);
        }

        $query = User::query();
        if ($target === 'roles') {
            $query->whereIn('role', $roles);
        } elseif ($target === 'users') {
            $query->whereIn('id', $userIds);
        }

        $title = $data['title'];
        $message = $data['message'];
        $type = $data['type'];
        $payloadData = $data['data'] ?? [];
        $pushData = array_merge($payloadData, [
            'notification_type' => $type,
        ]);

        $totalRecipients = 0;
        $notificationsCreated = 0;
        $pushSent = 0;
        $pushService = app(PushNotificationService::class);

        $query->select('id')->chunkById(500, function ($users) use (
            $title,
            $message,
            $type,
            $payloadData,
            $pushData,
            $pushService,
            &$totalRecipients,
            &$notificationsCreated,
            &$pushSent
        ) {
            if ($users->isEmpty()) {
                return;
            }

            $now = now();
            $rows = $users->map(fn ($recipient) => [
                'user_id' => $recipient->id,
                'title' => $title,
                'message' => $message,
                'type' => $type,
                'is_read' => false,
                'data' => $payloadData ?: null,
                'created_at' => $now,
                'updated_at' => $now,
            ])->all();

            UserNotification::insert($rows);
            $notificationsCreated += count($rows);
            $totalRecipients += $users->count();

            foreach ($users as $recipient) {
                if ($pushService->sendToUser((int) $recipient->id, $title, $message, $pushData)) {
                    $pushSent++;
                }
            }
        });

        return response()->json([
            'message' => 'Notifikasi berhasil dikirim.',
            'target' => [
                'mode' => $target,
                'roles' => $roles ?: null,
                'user_ids' => $userIds ?: null,
            ],
            'stats' => [
                'total_recipients' => $totalRecipients,
                'notifications_created' => $notificationsCreated,
                'push_sent' => $pushSent,
            ],
        ]);
    }
}
