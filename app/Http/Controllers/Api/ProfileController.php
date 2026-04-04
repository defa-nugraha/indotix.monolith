<?php

namespace App\Http\Controllers\Api;

use App\Concerns\PasswordValidationRules;
use App\Http\Controllers\Controller;
use App\Mail\EmailOtpMail;
use App\Models\EmailOtp;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\Rule;
use Throwable;

class ProfileController extends Controller
{
    use PasswordValidationRules;

    private const OTP_TTL_MINUTES = 10;
    private const OTP_MAX_ATTEMPTS = 5;
    private const RESEND_DEVICE_LIMIT = 3;
    private const RESEND_IP_LIMIT = 6;

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($user->id),
            ],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'gender' => ['sometimes', 'nullable', Rule::in(['male', 'female', 'other'])],
        ]);

        $user->fill($data);

        if (array_key_exists('email', $data) && $user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        return response()->json([
            'message' => 'Profil berhasil diperbarui.',
            'user' => $user,
        ]);
    }

    public function sendPasswordOtp(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->email) {
            return response()->json([
                'message' => 'Email tidak tersedia.',
            ], 422);
        }

        $key = sprintf('otp-password-resend:%s|%s', $user->id, $request->ip());
        $deviceKey = sprintf('otp-password-resend-device:%s', $this->deviceFingerprint($request));
        $ipKey = sprintf('otp-password-resend-ip:%s', $request->ip());

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
            ->where('purpose', 'change_password')
            ->delete();

        $otp = $this->sendOtp($user->id, $user->email, $user->name, 'change_password');

        if (! $otp) {
            return response()->json([
                'message' => 'Gagal mengirim OTP. Silakan coba lagi.',
            ], 500);
        }

        Cache::put(
            $this->passwordOtpCacheKey($user->id),
            true,
            now()->addMinutes(self::OTP_TTL_MINUTES)
        );

        return response()->json([
            'message' => 'OTP untuk ganti password telah dikirim.',
            'otp_expires_at' => $otp->expires_at?->toIso8601String(),
        ]);
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'current_password' => $this->currentPasswordRules(),
            'password' => $this->passwordRules(),
            'code' => ['required', 'string', 'size:6'],
        ]);

        if (! Cache::get($this->passwordOtpCacheKey($user->id))) {
            return response()->json([
                'message' => 'OTP belum diminta. Silakan kirim OTP terlebih dahulu.',
            ], 422);
        }

        $otp = EmailOtp::query()
            ->where('user_id', $user->id)
            ->where('purpose', 'change_password')
            ->latest()
            ->first();

        if (! $otp) {
            return response()->json([
                'message' => 'Kode OTP tidak ditemukan. Silakan kirim ulang.',
            ], 422);
        }

        if ($otp->attempts >= self::OTP_MAX_ATTEMPTS) {
            return response()->json([
                'message' => 'Percobaan OTP terlalu banyak. Silakan kirim ulang.',
            ], 422);
        }

        if ($otp->expires_at->isPast()) {
            return response()->json([
                'message' => 'Kode OTP sudah kedaluwarsa. Silakan kirim ulang.',
            ], 422);
        }

        $otp->increment('attempts');

        if (! Hash::check($data['code'], $otp->code_hash)) {
            return response()->json([
                'message' => 'Kode OTP salah.',
            ], 422);
        }

        $user->update([
            'password' => $data['password'],
        ]);

        EmailOtp::query()
            ->where('user_id', $user->id)
            ->where('purpose', 'change_password')
            ->delete();
        Cache::forget($this->passwordOtpCacheKey($user->id));

        return response()->json([
            'message' => 'Password berhasil diperbarui.',
        ]);
    }

    private function sendOtp(int $userId, string $email, string $name, string $purpose): ?EmailOtp
    {
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $otp = EmailOtp::create([
            'user_id' => $userId,
            'email' => $email,
            'purpose' => $purpose,
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

    private function passwordOtpCacheKey(int $userId): string
    {
        return sprintf('password-otp-sent:%s', $userId);
    }
}
