<?php

namespace App\Services;

use App\Jobs\SendPushNotificationJob;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

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
        $traceId = (string) Str::uuid();
        $this->assertFcmServiceAccountConfigured($traceId);

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
        $pushQueued = 0;

        Log::info('Admin push broadcast started', [
            'trace_id' => $traceId,
            'target' => $target,
            'roles' => $roles,
            'user_ids_count' => count($userIds),
            'type' => $type,
        ]);

        $query->select('id')->chunkById(500, function ($users) use (
            $title,
            $message,
            $type,
            $payloadData,
            $pushData,
            $traceId,
            &$totalRecipients,
            &$notificationsCreated,
            &$pushQueued
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
                SendPushNotificationJob::dispatch(
                    (int) $recipient->id,
                    $title,
                    $message,
                    $pushData,
                    ['trace_id' => $traceId]
                )->onQueue('push');
                $pushQueued++;
            }
        });

        Log::info('Admin push broadcast completed', [
            'trace_id' => $traceId,
            'total_recipients' => $totalRecipients,
            'notifications_created' => $notificationsCreated,
            'push_queued' => $pushQueued,
        ]);

        return [
            'trace_id' => $traceId,
            'target' => [
                'mode' => $target,
                'roles' => $roles ?: null,
                'user_ids' => $userIds ?: null,
            ],
            'stats' => [
                'total_recipients' => $totalRecipients,
                'notifications_created' => $notificationsCreated,
                'push_queued' => $pushQueued,
            ],
        ];
    }

    private function assertFcmServiceAccountConfigured(string $traceId): void
    {
        $path = config('services.fcm.service_account');
        if (! $path) {
            Log::warning('FCM_SERVICE_ACCOUNT missing for broadcast.', [
                'trace_id' => $traceId,
            ]);
            throw ValidationException::withMessages([
                'fcm' => 'FCM_SERVICE_ACCOUNT belum diatur.',
            ]);
        }

        $resolved = $this->normalizePath($path);
        if (! is_readable($resolved)) {
            Log::warning('FCM service account not readable for broadcast.', [
                'trace_id' => $traceId,
                'path' => $resolved,
            ]);
            throw ValidationException::withMessages([
                'fcm' => 'FCM_SERVICE_ACCOUNT tidak bisa dibaca.',
            ]);
        }
    }

    private function normalizePath(string $path): string
    {
        if (str_starts_with($path, DIRECTORY_SEPARATOR)) {
            return $path;
        }

        if (preg_match('/^[A-Za-z]:\\\\/', $path) === 1) {
            return $path;
        }

        return base_path($path);
    }
}
