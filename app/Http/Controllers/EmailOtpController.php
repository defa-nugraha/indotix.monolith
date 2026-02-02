<?php

namespace App\Http\Controllers;

use App\Mail\EmailOtpMail;
use App\Models\EmailOtp;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Throwable;
use Inertia\Inertia;
use Inertia\Response;

class EmailOtpController extends Controller
{
    private const OTP_TTL_MINUTES = 10;
    private const OTP_MAX_ATTEMPTS = 5;
    private const VERIFY_DEVICE_LIMIT = 6;
    private const VERIFY_IP_LIMIT = 20;
    private const RESEND_DEVICE_LIMIT = 3;
    private const RESEND_IP_LIMIT = 6;

    public function show(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return redirect()->route('dashboard');
        }

        $otp = EmailOtp::query()
            ->where('user_id', $user->id)
            ->latest()
            ->first();

        $status = $request->session()->get('status');

        if (! $otp || $otp->expires_at->isPast()) {
            $otp = $this->sendOtp($user->id, $user->email, $user->name);
            $status = $otp ? 'otp-sent' : 'otp-failed';
        }

        return Inertia::render('auth/verify-otp', [
            'email' => $user->email,
            'expiresAt' => $otp?->expires_at?->toIso8601String(),
            'status' => $status,
        ]);
    }

    public function verify(Request $request): RedirectResponse
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
            return back()->withErrors([
                'code' => 'Terlalu banyak percobaan. Coba lagi nanti.',
            ]);
        }
        RateLimiter::hit($verifyKey, 300);
        RateLimiter::hit($verifyDeviceKey, 300);
        RateLimiter::hit($verifyIpKey, 300);

        $otp = EmailOtp::query()
            ->where('user_id', $user->id)
            ->latest()
            ->first();

        if (! $otp) {
            return back()->withErrors(['code' => 'Kode OTP tidak ditemukan. Silakan kirim ulang.']);
        }

        if ($otp->attempts >= self::OTP_MAX_ATTEMPTS) {
            return back()->withErrors(['code' => 'Percobaan OTP terlalu banyak. Silakan kirim ulang.']);
        }

        if ($otp->expires_at->isPast()) {
            return back()->withErrors(['code' => 'Kode OTP sudah kedaluwarsa. Silakan kirim ulang.']);
        }

        $otp->increment('attempts');

        if (! Hash::check($request->string('code')->toString(), $otp->code_hash)) {
            return back()->withErrors(['code' => 'Kode OTP salah.']);
        }

        $user->forceFill([
            'email_verified_at' => now(),
        ])->save();

        EmailOtp::query()->where('user_id', $user->id)->delete();
        RateLimiter::clear($verifyKey);

        if ($user->is_suspended) {
            auth()->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->withErrors([
                'email' => 'Akun Anda sedang disuspend. Hubungi admin.',
            ]);
        }

        if ($user->role === 'mitra') {
            return redirect()->route('mitra.dashboard');
        }

        if ($user->role === 'admin') {
            return redirect()->route('dashboard');
        }

        if ($request->session()->has('booking_draft')) {
            return redirect()->route('booking.review');
        }

        if ($request->session()->has('wisata_booking_draft')) {
            return redirect()->route('wisata.booking.review');
        }

        return redirect()->route('home');
    }

    public function resend(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return redirect()->route('dashboard');
        }

        $key = sprintf('otp-resend:%s|%s', $user->id, $request->ip());
        $deviceKey = sprintf('otp-resend-device:%s', $this->deviceFingerprint($request));
        $ipKey = sprintf('otp-resend-ip:%s', $request->ip());

        if (
            RateLimiter::tooManyAttempts($key, self::RESEND_DEVICE_LIMIT)
            || RateLimiter::tooManyAttempts($deviceKey, self::RESEND_DEVICE_LIMIT)
            || RateLimiter::tooManyAttempts($ipKey, self::RESEND_IP_LIMIT)
        ) {
            return back()->withErrors([
                'code' => 'Terlalu banyak permintaan. Coba lagi nanti.',
            ]);
        }

        RateLimiter::hit($key, 300);
        RateLimiter::hit($deviceKey, 300);
        RateLimiter::hit($ipKey, 300);

        $otp = $this->sendOtp($user->id, $user->email, $user->name);
        if (! $otp) {
            return back()->withErrors([
                'code' => 'Gagal mengirim OTP. Silakan coba lagi.',
            ]);
        }

        return back()->with('status', 'otp-sent');
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
