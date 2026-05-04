<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\EmailOtp;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Throwable;

class SocialAuthController extends Controller
{
    public function redirect(Request $request): RedirectResponse
    {
        $role = $request->query('role');
        if (in_array($role, ['user', 'mitra'], true)) {
            $request->session()->put('social_role', $role);
        }

        if ($request->query('redirect')) {
            $request->session()->put('url.intended', $request->query('redirect'));
        }

        return Socialite::driver('google')->redirect();
    }

    public function callback(Request $request): RedirectResponse
    {
        try {
            $providerUser = Socialite::driver('google')->stateless()->user();
        } catch (Throwable $exception) {
            report($exception);

            return redirect()->route('login')->withErrors([
                'email' => 'Gagal login dengan Google. Silakan coba lagi.',
            ]);
        }

        $email = $providerUser->getEmail();
        if (! $email) {
            return redirect()->route('login')->withErrors([
                'email' => 'Email Google tidak ditemukan. Silakan coba akun lain.',
            ]);
        }

        $user = User::query()->where('email', $email)->first();
        $role = $request->session()->pull('social_role', 'user');

        if (! $user) {
            $user = User::create([
                'name' => $providerUser->getName() ?: 'Indotix User',
                'email' => $email,
                'password' => Hash::make(Str::random(32)),
                'role' => in_array($role, ['user', 'mitra'], true) ? $role : 'user',
            ]);

            // Google has already verified ownership of the email address.
            $user->forceFill(['email_verified_at' => now()])->save();
        } else {
            if (! $user->role && in_array($role, ['user', 'mitra'], true)) {
                $user->forceFill(['role' => $role]);
            }

            if (! $user->hasVerifiedEmail()) {
                $user->forceFill(['email_verified_at' => now()]);
            }

            $user->save();
        }

        EmailOtp::query()
            ->where('email', $email)
            ->where('purpose', 'verify_email')
            ->delete();

        if ($user->is_suspended) {
            return redirect()->route('login')->withErrors([
                'email' => 'Akun Anda sedang disuspend. Hubungi admin.',
            ]);
        }

        Auth::login($user, true);
        $request->session()->regenerate();

        if ($user->role === 'mitra') {
            return redirect()->route('mitra.dashboard');
        }

        if (str_starts_with((string) $user->role, 'admin')) {
            return redirect()->route('dashboard');
        }

        if ($request->session()->has('booking_draft')) {
            return redirect()->route('booking.review');
        }

        if ($request->session()->has('wisata_booking_draft')) {
            return redirect()->route('wisata.booking.review');
        }

        if ($request->session()->has('event_booking_draft')) {
            return redirect()->route('events.booking.review');
        }

        if ($request->session()->has('academy_booking_draft')) {
            return redirect()->route('academy.booking.review');
        }

        if ($request->session()->has('special_program_booking_draft')) {
            return redirect()->route('special-programs.booking.review');
        }

        return redirect()->route('home');
    }
}
