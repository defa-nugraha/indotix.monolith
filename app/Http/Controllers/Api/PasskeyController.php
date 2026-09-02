<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserPasskey;
use App\Services\PasskeyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class PasskeyController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $passkeys = $request->user()
            ->passkeys()
            ->whereNull('revoked_at')
            ->latest()
            ->get()
            ->map(fn (UserPasskey $passkey) => [
                'id' => $passkey->id,
                'label' => $passkey->label,
                'last_used_at' => $passkey->last_used_at?->toIso8601String(),
                'created_at' => $passkey->created_at?->toIso8601String(),
            ])
            ->values();

        return response()->json([
            'enabled' => $passkeys->isNotEmpty(),
            'passkeys' => $passkeys,
        ]);
    }

    public function registerOptions(Request $request, PasskeyService $passkeys): JsonResponse
    {
        $data = $request->validate([
            'label' => ['nullable', 'string', 'max:120'],
        ]);

        return response()->json([
            'publicKey' => $passkeys->registrationOptions($request->user(), $request, $data['label'] ?? null),
        ]);
    }

    public function register(Request $request, PasskeyService $passkeys): JsonResponse
    {
        $data = $request->validate([
            'label' => ['nullable', 'string', 'max:120'],
            'credential' => ['required', 'array'],
        ]);

        $passkey = $passkeys->verifyRegistration(
            $request->user(),
            $request,
            $data['credential'],
            $data['label'] ?? null
        );

        return response()->json([
            'message' => 'Login biometrik berhasil diaktifkan.',
            'passkey' => [
                'id' => $passkey->id,
                'label' => $passkey->label,
            ],
        ], 201);
    }

    public function loginOptions(Request $request, PasskeyService $passkeys): JsonResponse
    {
        $request->validate([
            'email' => ['nullable', 'email'],
        ]);

        $key = 'passkey-options:'.sha1('discoverable|'.$request->ip());
        if (RateLimiter::tooManyAttempts($key, 10)) {
            return response()->json(['message' => 'Terlalu banyak percobaan biometrik. Coba lagi nanti.'], 429);
        }
        RateLimiter::hit($key, 60);

        return response()->json([
            'publicKey' => $passkeys->authenticationOptions($request),
        ]);
    }

    public function login(Request $request, PasskeyService $passkeys): JsonResponse
    {
        $request->validate([
            'credential' => ['required', 'array'],
            'device_name' => ['nullable', 'string', 'max:255'],
        ]);

        $key = 'passkey-login:'.sha1($request->ip().'|'.(string) data_get($request->input('credential'), 'id'));
        if (RateLimiter::tooManyAttempts($key, 5)) {
            return response()->json(['message' => 'Terlalu banyak percobaan biometrik. Coba lagi nanti.'], 429);
        }
        RateLimiter::hit($key, 60);

        $user = $passkeys->verifyAuthentication($request, $request->input('credential'));

        if (! $user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email belum terverifikasi. Silakan login manual untuk verifikasi email.'], 403);
        }

        if ($user->is_suspended) {
            return response()->json(['message' => 'Akun sedang dinonaktifkan.'], 403);
        }

        RateLimiter::clear($key);

        return response()->json([
            'token' => $user->createToken($request->input('device_name') ?: 'mobile-passkey')->plainTextToken,
            'token_type' => 'Bearer',
            'user' => $user,
        ]);
    }

    public function destroy(Request $request): JsonResponse
    {
        $request->user()
            ->passkeys()
            ->whereNull('revoked_at')
            ->update(['revoked_at' => now()]);

        return response()->json([
            'message' => 'Login biometrik telah dinonaktifkan.',
        ]);
    }
}
