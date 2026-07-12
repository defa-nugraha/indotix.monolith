<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmailOtp;
use App\Notifications\VerifyEmailLinkNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class OtpController extends Controller
{
    private const RESEND_DEVICE_LIMIT = 3;

    private const RESEND_IP_LIMIT = 6;

    public function verify(Request $request): JsonResponse
    {
        return response()->json([
            'message' => 'Verifikasi email sekarang menggunakan link. Silakan buka link verifikasi yang dikirim ke email Anda.',
        ], 410);
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

        EmailOtp::query()
            ->where('user_id', $user->id)
            ->where('purpose', 'verify_email')
            ->delete();

        $user->notify(new VerifyEmailLinkNotification(forMobileApp: true));

        return response()->json([
            'message' => 'Link verifikasi baru telah dikirim.',
        ]);
    }

    private function deviceFingerprint(Request $request): string
    {
        $userAgent = $request->userAgent() ?? 'unknown';

        return sha1($userAgent.'|'.$request->ip());
    }
}
