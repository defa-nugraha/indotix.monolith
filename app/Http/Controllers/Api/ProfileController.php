<?php

namespace App\Http\Controllers\Api;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Http\Controllers\Controller;
use App\Mail\EmailOtpMail;
use App\Models\AcademyBooking;
use App\Models\Booking;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\EmailOtp;
use App\Models\EventBooking;
use App\Models\ProductReview;
use App\Models\SouvenirOrder;
use App\Models\SpecialProgramBooking;
use App\Models\User;
use App\Models\UserAddress;
use App\Models\UserDeviceToken;
use App\Models\UserNotification;
use App\Models\WisataBooking;
use App\Models\WisataReview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\Rule;
use Throwable;

class ProfileController extends Controller
{
    use PasswordValidationRules;
    use ProfileValidationRules;

    private const OTP_TTL_MINUTES = 10;
    private const OTP_MAX_ATTEMPTS = 5;
    private const RESEND_DEVICE_LIMIT = 3;
    private const RESEND_IP_LIMIT = 6;

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $rules = $this->profileRules($user->id);
        $requestedEmail = trim((string) $request->input('email', ''));
        $emailIsChanging = $requestedEmail !== ''
            && strcasecmp($requestedEmail, (string) $user->email) !== 0;

        if ($emailIsChanging) {
            $rules['current_password'] = ['required', 'string'];
        }

        $data = $request->validate($rules);

        if ($emailIsChanging && ! Hash::check((string) $data['current_password'], (string) $user->password)) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'current_password' => 'Password saat ini tidak sesuai.',
            ]);
        }

        unset($data['current_password']);

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

    public function addresses(Request $request): JsonResponse
    {
        $addresses = $request->user()
            ->addresses()
            ->orderByDesc('is_default')
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (UserAddress $address) => $this->addressPayload($address))
            ->values();

        return response()->json([
            'addresses' => $addresses,
        ]);
    }

    public function storeAddress(Request $request): JsonResponse
    {
        $data = $this->validateAddress($request);
        $data['is_default'] = (bool) ($data['is_default'] ?? false);

        $address = $request->user()->addresses()->create($data);

        if ($data['is_default'] || $request->user()->addresses()->count() === 1) {
            $this->makeDefaultAddress($address);
        } else {
            $this->ensureDefaultAddress($request->user()->id);
        }

        return response()->json([
            'message' => 'Alamat berhasil ditambahkan.',
            'address' => $this->addressPayload($address->fresh()),
        ], 201);
    }

    public function updateAddress(Request $request, UserAddress $address): JsonResponse
    {
        $this->authorizeAddress($request, $address);

        $data = $this->validateAddress($request);
        $data['is_default'] = (bool) ($data['is_default'] ?? false);

        $address->update($data);

        if ($data['is_default']) {
            $this->makeDefaultAddress($address);
        } else {
            $this->ensureDefaultAddress($request->user()->id);
        }

        return response()->json([
            'message' => 'Alamat berhasil diperbarui.',
            'address' => $this->addressPayload($address->fresh()),
        ]);
    }

    public function setDefaultAddress(Request $request, UserAddress $address): JsonResponse
    {
        $this->authorizeAddress($request, $address);
        $this->makeDefaultAddress($address);

        return response()->json([
            'message' => 'Alamat utama berhasil diperbarui.',
            'address' => $this->addressPayload($address->fresh()),
        ]);
    }

    public function destroyAddress(Request $request, UserAddress $address): JsonResponse
    {
        $this->authorizeAddress($request, $address);

        $userId = $address->user_id;
        $wasDefault = $address->is_default;
        $address->delete();

        if ($wasDefault) {
            $this->ensureDefaultAddress($userId);
        }

        return response()->json([
            'message' => 'Alamat berhasil dihapus.',
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

    public function destroy(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'user') {
            return response()->json([
                'message' => 'Akun ini tidak dapat dihapus melalui API.',
            ], 403);
        }

        $request->validate([
            'password' => $this->currentPasswordRules(),
        ]);

        $finalStatuses = ['cancelled', 'completed', 'expired', 'no_show'];
        $counts = [
            'hotel' => Booking::query()
                ->where('user_id', $user->id)
                ->where(function ($query) use ($finalStatuses) {
                    $query->whereNull('status')
                        ->orWhereNotIn('status', $finalStatuses);
                })
                ->count(),
            'wisata' => WisataBooking::query()
                ->where('user_id', $user->id)
                ->where(function ($query) use ($finalStatuses) {
                    $query->whereNull('status')
                        ->orWhereNotIn('status', $finalStatuses);
                })
                ->count(),
            'event' => EventBooking::query()
                ->where('user_id', $user->id)
                ->where(function ($query) use ($finalStatuses) {
                    $query->whereNull('status')
                        ->orWhereNotIn('status', $finalStatuses);
                })
                ->count(),
            'academy' => AcademyBooking::query()
                ->where('user_id', $user->id)
                ->where(function ($query) use ($finalStatuses) {
                    $query->whereNull('status')
                        ->orWhereNotIn('status', $finalStatuses);
                })
                ->count(),
            'special_program' => SpecialProgramBooking::query()
                ->where('user_id', $user->id)
                ->where(function ($query) use ($finalStatuses) {
                    $query->whereNull('status')
                        ->orWhereNotIn('status', $finalStatuses);
                })
                ->count(),
            'souvenir' => SouvenirOrder::query()
                ->where('user_id', $user->id)
                ->where(function ($query) {
                    $query->whereNull('status')
                        ->orWhereNotIn('status', ['cancelled', 'completed']);
                })
                ->count(),
        ];

        $blocked = array_filter($counts, static fn ($count) => $count > 0);
        if ($blocked) {
            $details = collect($blocked)
                ->map(fn ($count, $key) => "{$key} ({$count})")
                ->implode(', ');

            return response()->json([
                'message' => "Akun tidak dapat dihapus karena masih memiliki transaksi aktif: {$details}.",
                'errors' => [
                    'account' => ["Akun tidak dapat dihapus karena masih memiliki transaksi aktif: {$details}."],
                ],
            ], 422);
        }

        DB::transaction(function () use ($user) {
            $conversationIds = ChatConversation::query()
                ->where('user_id', $user->id)
                ->orWhere('partner_id', $user->id)
                ->pluck('id');

            ChatMessage::query()
                ->whereIn('conversation_id', $conversationIds)
                ->orWhere('sender_id', $user->id)
                ->delete();

            ChatConversation::query()
                ->whereIn('id', $conversationIds)
                ->delete();

            UserAddress::query()->where('user_id', $user->id)->delete();
            UserNotification::query()->where('user_id', $user->id)->delete();
            UserDeviceToken::query()->where('user_id', $user->id)->delete();
            EmailOtp::query()->where('user_id', $user->id)->delete();
            ProductReview::query()->where('user_id', $user->id)->get()->each->delete();
            WisataReview::query()->where('user_id', $user->id)->delete();

            DB::table('sessions')->where('user_id', $user->id)->delete();
            DB::table('password_reset_tokens')->where('email', $user->email)->delete();

            $user->tokens()->delete();
            $user->delete();
        });

        return response()->json([
            'message' => 'Akun berhasil dihapus.',
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

    private function validateAddress(Request $request): array
    {
        return $request->validate([
            'label' => ['required', 'string', 'max:50'],
            'recipient_name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:30'],
            'address_line' => ['required', 'string', 'max:500'],
            'province' => ['nullable', 'string', 'max:120'],
            'province_code' => ['nullable', 'string', 'max:20'],
            'city' => ['nullable', 'string', 'max:120'],
            'city_code' => ['nullable', 'string', 'max:20'],
            'district' => ['nullable', 'string', 'max:120'],
            'district_code' => ['nullable', 'string', 'max:20'],
            'village' => ['nullable', 'string', 'max:120'],
            'village_code' => ['nullable', 'string', 'max:20'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'is_default' => ['nullable', 'boolean'],
        ]);
    }

    private function authorizeAddress(Request $request, UserAddress $address): void
    {
        abort_if($address->user_id !== $request->user()->id, 403);
    }

    private function makeDefaultAddress(UserAddress $address): void
    {
        UserAddress::query()
            ->where('user_id', $address->user_id)
            ->where('id', '!=', $address->id)
            ->update(['is_default' => false]);

        if (! $address->is_default) {
            $address->update(['is_default' => true]);
        }
    }

    private function ensureDefaultAddress(int $userId): void
    {
        $hasDefault = UserAddress::query()
            ->where('user_id', $userId)
            ->where('is_default', true)
            ->exists();

        if ($hasDefault) {
            return;
        }

        $fallback = UserAddress::query()
            ->where('user_id', $userId)
            ->orderByDesc('updated_at')
            ->first();

        if ($fallback) {
            $fallback->update(['is_default' => true]);
        }
    }

    private function addressPayload(?UserAddress $address): ?array
    {
        if (! $address) {
            return null;
        }

        return [
            'id' => $address->id,
            'label' => $address->label,
            'recipient_name' => $address->recipient_name,
            'phone' => $address->phone,
            'address_line' => $address->address_line,
            'village' => $address->village,
            'village_code' => $address->village_code,
            'district' => $address->district,
            'district_code' => $address->district_code,
            'city' => $address->city,
            'city_code' => $address->city_code,
            'province' => $address->province,
            'province_code' => $address->province_code,
            'postal_code' => $address->postal_code,
            'notes' => $address->notes,
            'is_default' => (bool) $address->is_default,
            'formatted_address' => $address->formatted_address,
        ];
    }
}
