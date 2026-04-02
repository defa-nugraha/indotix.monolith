<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AdminNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
            'data' => ['nullable', 'array'],
        ]);

        $broadcast = app(AdminNotificationService::class)->broadcast(
            $data['title'],
            $data['message'],
            $data['type'],
            'roles',
            ['user'],
            [],
            $data['data'] ?? []
        );

        return response()->json([
            'message' => 'Notifikasi berhasil dikirim.',
            'trace_id' => $broadcast['trace_id'] ?? null,
            'target' => $broadcast['target'],
            'stats' => $broadcast['stats'],
        ]);
    }
}
