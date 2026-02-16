<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\EmailOtpMail;
use App\Models\EmailOtp;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\Rule;
use Throwable;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['nullable', Rule::in(['user', 'mitra'])],
            'device_name' => ['nullable', 'string', 'max:255'],
        ]);

        $existingUser = User::query()->where('email', $data['email'])->first();

        if ($existingUser) {
            if ($existingUser->hasVerifiedEmail()) {
                return response()->json(['message' => 'Email sudah terdaftar.'], 422);
            }

            $otp = $this->sendOtp($existingUser);
            if (! $otp) {
                return response()->json(['message' => 'Gagal mengirim OTP. Silakan coba lagi.'], 500);
            }

            $token = $existingUser->createToken($data['device_name'] ?? 'mobile')->plainTextToken;

            return response()->json([
                'token' => $token,
                'token_type' => 'Bearer',
                'user' => $existingUser,
                'requires_otp' => true,
                'otp_expires_at' => $otp->expires_at?->toIso8601String(),
            ], 201);
        }

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => $data['role'] ?? 'user',
        ]);

        $otp = $this->sendOtp($user);
        if (! $otp) {
            $user->delete();

            return response()->json(['message' => 'Gagal mengirim OTP. Silakan coba lagi.'], 500);
        }

        $token = $user->createToken($data['device_name'] ?? 'mobile')->plainTextToken;

        return response()->json([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
            'requires_otp' => true,
            'otp_expires_at' => $otp->expires_at?->toIso8601String(),
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
            $limitKey = sprintf('otp-login-resend:%s|%s', $user->id, $request->ip());
            if (RateLimiter::tooManyAttempts($limitKey, 3)) {
                return response()->json(['message' => 'Terlalu banyak permintaan OTP. Coba lagi nanti.'], 429);
            }
            RateLimiter::hit($limitKey, 300);

            $otp = $this->sendOtp($user);
            if (! $otp) {
                return response()->json(['message' => 'Gagal mengirim OTP. Silakan coba lagi.'], 500);
            }

            return response()->json([
                'message' => 'Email belum terverifikasi. OTP baru telah dikirim.',
                'requires_otp' => true,
                'otp_expires_at' => $otp->expires_at?->toIso8601String(),
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

    private function sendOtp(User $user): ?EmailOtp
    {
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $otp = EmailOtp::create([
            'user_id' => $user->id,
            'email' => $user->email,
            'code_hash' => Hash::make($code),
            'expires_at' => now()->addMinutes(10),
            'attempts' => 0,
        ]);

        try {
            Mail::to($user->email)->send(new EmailOtpMail($user->name, $code, 10));
        } catch (Throwable $exception) {
            report($exception);
            $otp->delete();

            return null;
        }

        return $otp;
    }
}
