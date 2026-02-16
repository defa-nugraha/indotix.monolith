<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\EmailOtpMail;
use App\Models\EmailOtp;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Throwable;

class OtpController extends Controller
{
    private const OTP_TTL_MINUTES = 10;
    private const OTP_MAX_ATTEMPTS = 5;
    private const VERIFY_DEVICE_LIMIT = 6;
    private const VERIFY_IP_LIMIT = 20;
    private const RESEND_DEVICE_LIMIT = 3;
    private const RESEND_IP_LIMIT = 6;

    public function verify(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ]);

        $verifyKey = sprintf('otp-verify:%s|%s', $user->id, $request->ip());
        $verifyDeviceKey = sprintf('otp-verify-device:%s', $this->deviceFingerprint($request));
        $verifyIpKey = sprintf('otp-verify-ip:%s', $request->ip());

        if (
            RateLimiter::tooManyAttempts($verifyKey, self::VERIFY_DEVICE_LIMIT)
            || RateLimiter::tooManyAttempts($verifyDeviceKey, self::VERIFY_DEVICE_LIMIT)
            || RateLimiter::tooManyAttempts($verifyIpKey, self::VERIFY_IP_LIMIT)
        ) {
            return response()->json([
                'message' => 'Terlalu banyak percobaan. Coba lagi nanti.',
            ], 429);
        }

        RateLimiter::hit($verifyKey, 300);
        RateLimiter::hit($verifyDeviceKey, 300);
        RateLimiter::hit($verifyIpKey, 300);

        $otp = EmailOtp::query()
            ->where('user_id', $user->id)
            ->latest()
            ->first();

        if (! $otp) {
            return response()->json(['message' => 'Kode OTP tidak ditemukan. Silakan kirim ulang.'], 422);
        }

        if ($otp->attempts >= self::OTP_MAX_ATTEMPTS) {
            return response()->json(['message' => 'Percobaan OTP terlalu banyak. Silakan kirim ulang.'], 422);
        }

        if ($otp->expires_at->isPast()) {
            return response()->json(['message' => 'Kode OTP sudah kedaluwarsa. Silakan kirim ulang.'], 422);
        }

        $otp->increment('attempts');

        if (! Hash::check($request->string('code')->toString(), $otp->code_hash)) {
            return response()->json(['message' => 'Kode OTP salah.'], 422);
        }

        $user->forceFill([
            'email_verified_at' => now(),
        ])->save();

        EmailOtp::query()->where('user_id', $user->id)->delete();
        RateLimiter::clear($verifyKey);

        return response()->json([
            'message' => 'OTP berhasil diverifikasi.',
            'user' => $user,
        ]);
    }

    public function resend(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Email sudah terverifikasi.',
            ]);
        }

        $key = sprintf('otp-resend:%s|%s', $user->id, $request->ip());
        $deviceKey = sprintf('otp-resend-device:%s', $this->deviceFingerprint($request));
        $ipKey = sprintf('otp-resend-ip:%s', $request->ip());

        if (
            RateLimiter::tooManyAttempts($key, self::RESEND_DEVICE_LIMIT)
            || RateLimiter::tooManyAttempts($deviceKey, self::RESEND_DEVICE_LIMIT)
            || RateLimiter::tooManyAttempts($ipKey, self::RESEND_IP_LIMIT)
        ) {
            return response()->json([
                'message' => 'Terlalu banyak permintaan. Coba lagi nanti.',
            ], 429);
        }

        RateLimiter::hit($key, 300);
        RateLimiter::hit($deviceKey, 300);
        RateLimiter::hit($ipKey, 300);

        $otp = $this->sendOtp($user->id, $user->email, $user->name);

        if (! $otp) {
            return response()->json([
                'message' => 'Gagal mengirim OTP. Silakan coba lagi.',
            ], 500);
        }

        return response()->json([
            'message' => 'OTP baru telah dikirim.',
            'otp_expires_at' => $otp->expires_at?->toIso8601String(),
        ]);
    }

    private function sendOtp(int $userId, string $email, string $name): ?EmailOtp
    {
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $otp = EmailOtp::create([
            'user_id' => $userId,
            'email' => $email,
            'code_hash' => Hash::make($code),
            'expires_at' => now()->addMinutes(self::OTP_TTL_MINUTES),
            'attempts' => 0,
        ]);

        try {
            Mail::to($email)->send(new EmailOtpMail($name, $code, self::OTP_TTL_MINUTES));
        } catch (Throwable $exception) {
            report($exception);
            $otp->delete();

            return null;
        }

        return $otp;
    }

    private function deviceFingerprint(Request $request): string
    {
        $userAgent = $request->userAgent() ?? 'unknown';

        return sha1($userAgent.'|'.$request->ip());
    }
}
