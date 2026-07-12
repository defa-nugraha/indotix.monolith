<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmailOtp;
use App\Models\User;
use App\Notifications\VerifyEmailLinkNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['nullable', Rule::in(['user', 'mitra'])],
            'device_name' => ['nullable', 'string', 'max:255'],
        ]);

        $existingUser = User::query()->where('email', $data['email'])->first();

        if ($existingUser) {
            if ($existingUser->hasVerifiedEmail()) {
                return response()->json(['message' => 'Email sudah terdaftar.'], 422);
            }

            $this->clearPendingEmailVerificationOtp($existingUser);
            $existingUser->notify(new VerifyEmailLinkNotification(forMobileApp: true));

            $token = $existingUser->createToken($data['device_name'] ?? 'mobile')->plainTextToken;

            return response()->json([
                'message' => 'Email belum terverifikasi. Link verifikasi baru telah dikirim.',
                'token' => $token,
                'token_type' => 'Bearer',
                'user' => $existingUser,
                'requires_email_verification' => true,
                'verification_method' => 'link',
            ], 201);
        }

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => $data['role'] ?? 'user',
        ]);

        $this->clearPendingEmailVerificationOtp($user);
        $user->notify(new VerifyEmailLinkNotification(forMobileApp: true));

        $token = $user->createToken($data['device_name'] ?? 'mobile')->plainTextToken;

        return response()->json([
            'message' => 'Registrasi berhasil. Link verifikasi telah dikirim ke email Anda.',
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
            'requires_email_verification' => true,
            'verification_method' => 'link',
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:255'],
        ]);

        $user = User::query()->where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Email atau password salah.'], 422);
        }

        if (! $user->hasVerifiedEmail()) {
            $limitKey = sprintf('verification-link-login-resend:%s|%s', $user->id, $request->ip());
            if (RateLimiter::tooManyAttempts($limitKey, 3)) {
                return response()->json(['message' => 'Terlalu banyak permintaan link verifikasi. Coba lagi nanti.'], 429);
            }
            RateLimiter::hit($limitKey, 300);

            $user->notify(new VerifyEmailLinkNotification(forMobileApp: true));

            $token = $user->createToken($data['device_name'] ?? 'mobile')->plainTextToken;

            return response()->json([
                'message' => 'Email belum terverifikasi. Link verifikasi baru telah dikirim.',
                'token' => $token,
                'token_type' => 'Bearer',
                'user' => $user,
                'requires_email_verification' => true,
                'verification_method' => 'link',
            ], 403);
        }

        if ($user->is_suspended) {
            return response()->json(['message' => 'Akun sedang dinonaktifkan.'], 403);
        }

        $token = $user->createToken($data['device_name'] ?? 'mobile')->plainTextToken;

        return response()->json([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logout berhasil.',
        ]);
    }

    private function clearPendingEmailVerificationOtp(User $user): void
    {
        EmailOtp::query()
            ->where('user_id', $user->id)
            ->where('purpose', 'verify_email')
            ->delete();
    }
}
