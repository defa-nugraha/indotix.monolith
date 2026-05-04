<?php

use App\Mail\EmailOtpMail;
use App\Models\EmailOtp;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

test('web registration sends verification otp when otp page is opened', function () {
    Mail::fake();

    $email = 'otp-web@example.com';

    $this->post(route('register'), [
        'name' => 'OTP Web User',
        'email' => $email,
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'role' => 'user',
    ])->assertRedirect(route('email-otp.notice'));

    $user = User::query()->where('email', $email)->firstOrFail();

    expect($user->hasVerifiedEmail())->toBeFalse();
    expect(EmailOtp::query()->where('user_id', $user->id)->where('purpose', 'verify_email')->count())->toBe(0);
    Mail::assertNothingSent();

    $this->actingAs($user)
        ->get(route('email-otp.notice'))
        ->assertOk();

    expect(EmailOtp::query()->where('user_id', $user->id)->where('purpose', 'verify_email')->count())->toBe(1);
    Mail::assertSent(EmailOtpMail::class, 1);
});

test('web otp page does not spam otp on refresh within the same session', function () {
    Mail::fake();

    $user = User::factory()->unverified()->create();

    $this->actingAs($user)->get(route('email-otp.notice'))->assertOk();
    $this->actingAs($user)->get(route('email-otp.notice'))->assertOk();

    expect(EmailOtp::query()->where('user_id', $user->id)->where('purpose', 'verify_email')->count())->toBe(1);
    Mail::assertSent(EmailOtpMail::class, 1);
});

test('api registration sends otp for a new unverified account', function () {
    Mail::fake();

    $this->postJson('/api/auth/register', [
        'name' => 'OTP API User',
        'email' => 'otp-api@example.com',
        'password' => 'password123',
        'role' => 'user',
        'device_name' => 'test-device',
    ])
        ->assertCreated()
        ->assertJsonPath('requires_otp', true)
        ->assertJsonStructure(['token', 'token_type', 'user', 'requires_otp', 'otp_expires_at']);

    $user = User::query()->where('email', 'otp-api@example.com')->firstOrFail();

    expect(EmailOtp::query()->where('user_id', $user->id)->where('purpose', 'verify_email')->count())->toBe(1);
    Mail::assertSent(EmailOtpMail::class, 1);
});

test('api registration for existing unverified email replaces stale otp and sends a new one', function () {
    Mail::fake();

    $user = User::factory()->unverified()->create([
        'email' => 'otp-existing@example.com',
    ]);

    EmailOtp::query()->create([
        'user_id' => $user->id,
        'email' => $user->email,
        'purpose' => 'verify_email',
        'code_hash' => bcrypt('111111'),
        'expires_at' => now()->addMinutes(10),
        'attempts' => 0,
    ]);

    $this->postJson('/api/auth/register', [
        'name' => 'OTP Existing User',
        'email' => $user->email,
        'password' => 'password123',
        'role' => 'user',
        'device_name' => 'test-device',
    ])
        ->assertCreated()
        ->assertJsonPath('requires_otp', true);

    expect(EmailOtp::query()->where('user_id', $user->id)->where('purpose', 'verify_email')->count())->toBe(1);
    Mail::assertSent(EmailOtpMail::class, 1);
});
