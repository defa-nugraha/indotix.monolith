<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmailOtp;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    public function google(Request $request): JsonResponse
    {
        $data = $request->validate([
            'access_token' => ['required', 'string'],
            'role' => ['nullable', Rule::in(['user', 'mitra'])],
            'device_name' => ['nullable', 'string', 'max:255'],
        ]);

        try {
            $googleUser = Socialite::driver('google')->stateless()->userFromToken($data['access_token']);
        } catch (\Throwable $exception) {
            return response()->json(['message' => 'Token Google tidak valid.'], 422);
        }

        if (! $googleUser->getEmail()) {
            return response()->json(['message' => 'Email Google tidak ditemukan.'], 422);
        }

        $user = User::query()->where('email', $googleUser->getEmail())->first();

        if (! $user) {
            $user = User::create([
                'name' => $googleUser->getName() ?: ($googleUser->getNickname() ?: 'User'),
                'email' => $googleUser->getEmail(),
                'password' => Str::random(40),
                'role' => $data['role'] ?? 'user',
            ]);

            // Google sign-in only returns a verified Google account email.
            $user->forceFill(['email_verified_at' => now()])->save();
        } else {
            if (! $user->email_verified_at) {
                $user->email_verified_at = now();
                $user->save();
            }
        }

        EmailOtp::query()
            ->where('email', $googleUser->getEmail())
            ->where('purpose', 'verify_email')
            ->delete();

        if ($user->is_suspended) {
            return response()->json(['message' => 'Akun sedang dinonaktifkan.'], 403);
        }

        $token = $user->createToken($data['device_name'] ?? 'mobile')->plainTextToken;

        return response()->json([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
            'requires_otp' => false,
        ]);
    }
}
