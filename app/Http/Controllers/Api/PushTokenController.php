<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserDeviceToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PushTokenController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string', 'max:512'],
            'platform' => ['nullable', 'string', 'max:32'],
            'device_id' => ['nullable', 'string', 'max:128'],
        ]);

        $user = $request->user();

        $token = UserDeviceToken::query()->firstOrNew([
            'token' => $data['token'],
        ]);

        $token->fill([
            'user_id' => $user->id,
            'platform' => $data['platform'] ?? $token->platform,
            'device_id' => $data['device_id'] ?? $token->device_id,
            'is_active' => true,
            'last_used_at' => now(),
        ]);
        $token->save();

        return response()->json([
            'token' => [
                'id' => $token->id,
                'token' => $token->token,
                'platform' => $token->platform,
                'device_id' => $token->device_id,
                'is_active' => $token->is_active,
            ],
        ]);
    }

    public function revoke(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['nullable', 'string', 'max:512'],
            'device_id' => ['nullable', 'string', 'max:128'],
        ]);

        $query = UserDeviceToken::query()->where('user_id', $request->user()->id);

        if (! empty($data['token'])) {
            $query->where('token', $data['token']);
        } elseif (! empty($data['device_id'])) {
            $query->where('device_id', $data['device_id']);
        } else {
            return response()->json(['message' => 'Token atau device_id wajib diisi.'], 422);
        }

        $updated = $query->update([
            'is_active' => false,
            'last_used_at' => now(),
        ]);

        return response()->json([
            'updated' => $updated,
        ]);
    }
}
