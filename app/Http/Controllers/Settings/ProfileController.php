<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Models\AcademyBooking;
use App\Models\Booking;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\EmailOtp;
use App\Models\EventBooking;
use App\Models\ProductReview;
use App\Models\SouvenirOrder;
use App\Models\SpecialProgramBooking;
use App\Models\UserAddress;
use App\Models\UserDeviceToken;
use App\Models\UserNotification;
use App\Models\WisataBooking;
use App\Models\WisataReview;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        $provinces = DB::table('provinces')
            ->orderBy('name')
            ->get(['code', 'name'])
            ->map(fn ($item) => ['value' => $item->code, 'label' => $item->name])
            ->all();

        $cities = DB::table('regencies')
            ->join('provinces', 'regencies.province_code', '=', 'provinces.code')
            ->orderBy('regencies.name')
            ->get([
                'regencies.code as code',
                'regencies.name as name',
                'regencies.province_code as province_code',
            ])
            ->map(fn ($item) => [
                'value' => $item->code,
                'label' => $item->name,
                'province_code' => $item->province_code,
            ])
            ->all();

        $districts = DB::table('districts')
            ->join('regencies', 'districts.regency_code', '=', 'regencies.code')
            ->join('provinces', 'regencies.province_code', '=', 'provinces.code')
            ->orderBy('districts.name')
            ->get([
                'districts.code as code',
                'districts.name as name',
                'districts.regency_code as city_code',
                'regencies.province_code as province_code',
            ])
            ->map(fn ($item) => [
                'value' => $item->code,
                'label' => $item->name,
                'city_code' => $item->city_code,
                'province_code' => $item->province_code,
            ])
            ->all();

        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
            'provinces' => $provinces,
            'cities' => $cities,
            'districts' => $districts,
            'addresses' => $request->user()
                ? $request->user()
                    ->addresses()
                    ->orderByDesc('is_default')
                    ->orderByDesc('updated_at')
                    ->get()
                : [],
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return to_route('profile.edit');
    }

    /**
     * Delete the user's profile.
     */
    public function destroy(ProfileDeleteRequest $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->role !== 'user') {
            return back()->withErrors([
                'account' => 'Akun ini tidak dapat dihapus melalui halaman ini.',
            ]);
        }

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

            return back()->withErrors([
                'account' => "Akun tidak dapat dihapus karena masih memiliki transaksi aktif: {$details}.",
            ]);
        }

        Auth::logout();

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

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('public.delete-account', [
            'status' => 'success',
        ]);
    }
}
