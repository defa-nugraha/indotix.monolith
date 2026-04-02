<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AdminNotificationService;
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

        $broadcast = app(AdminNotificationService::class)->broadcast(
            $data['title'],
            $data['message'],
            $data['type'],
            $target,
            $roles,
            $userIds,
            $data['data'] ?? []
        );

        return response()->json([
            'message' => 'Notifikasi berhasil dikirim.',
            'target' => $broadcast['target'],
            'stats' => $broadcast['stats'],
        ]);
    }
}
