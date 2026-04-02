<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserNotification;

class AdminNotificationService
{
    public function broadcast(
        string $title,
        string $message,
        string $type,
        string $target,
        array $roles = [],
        array $userIds = [],
        array $data = []
    ): array {
        $query = User::query();
        if ($target === 'roles') {
            $query->whereIn('role', $roles);
        } elseif ($target === 'users') {
            $query->whereIn('id', $userIds);
        }

        $payloadData = $data;
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

        return [
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
        ];
    }
}
