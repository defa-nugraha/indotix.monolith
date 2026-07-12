<?php

use App\Models\EmailOtp;
use App\Models\User;
use App\Notifications\VerifyEmailLinkNotification;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;

uses(RefreshDatabase::class);

test('web registration sends verification link and does not create email otp', function () {
    Notification::fake();

    $email = 'verify-link-web@example.com';

    $this->post(route('register'), [
        'name' => 'Verify Link Web User',
        'email' => $email,
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'role' => 'user',
    ])->assertRedirect(route('verification.notice'));

    $user = User::query()->where('email', $email)->firstOrFail();

    expect($user->hasVerifiedEmail())->toBeFalse();
    expect(EmailOtp::query()->where('user_id', $user->id)->where('purpose', 'verify_email')->count())->toBe(0);
    expect(EmailOtp::query()->where('user_id', $user->id)->where('purpose', 'verify_email')->count())->toBe(0);
    Notification::assertSentTo(
        $user,
        VerifyEmailLinkNotification::class,
        fn (VerifyEmailLinkNotification $notification) => ! $notification->isForMobileApp(),
    );
});

test('old web otp routes redirect to verification link flow without sending otp', function () {
    Notification::fake();

    $user = User::factory()->unverified()->create();

    $this->actingAs($user)
        ->get(route('email-otp.notice'))
        ->assertRedirect(route('verification.notice'));

    $this->actingAs($user)
        ->post(route('email-otp.resend'))
        ->assertRedirect(route('verification.notice'));

    expect(EmailOtp::query()->where('user_id', $user->id)->where('purpose', 'verify_email')->count())->toBe(0);
    Notification::assertSentTo(
        $user,
        VerifyEmailLinkNotification::class,
        fn (VerifyEmailLinkNotification $notification) => ! $notification->isForMobileApp(),
    );
});

test('mobile signed link verifies email without browser authentication and opens app', function () {
    Event::fake();

    $user = User::factory()->unverified()->create();
    $verificationUrl = URL::temporarySignedRoute(
        'mobile.verification.verify',
        now()->addMinutes(60),
        [
            'id' => $user->id,
            'hash' => sha1($user->getEmailForVerification()),
        ],
    );

    $this->get($verificationUrl)
        ->assertOk()
        ->assertSee('Email berhasil diverifikasi')
        ->assertSee('indotix://email-verified?status=success', false)
        ->assertSee("user={$user->id}", false);

    expect($user->fresh()->hasVerifiedEmail())->toBeTrue();
    Event::assertDispatched(Verified::class);
});

test('mobile verification link rejects a mismatched email hash', function () {
    Event::fake();

    $user = User::factory()->unverified()->create();
    $verificationUrl = URL::temporarySignedRoute(
        'mobile.verification.verify',
        now()->addMinutes(60),
        [
            'id' => $user->id,
            'hash' => sha1('wrong@example.com'),
        ],
    );

    $this->get($verificationUrl)->assertForbidden();

    expect($user->fresh()->hasVerifiedEmail())->toBeFalse();
    Event::assertNotDispatched(Verified::class);
});

test('mobile verification link rejects an expired signature', function () {
    $user = User::factory()->unverified()->create();
    $verificationUrl = URL::temporarySignedRoute(
        'mobile.verification.verify',
        now()->subMinute(),
        [
            'id' => $user->id,
            'hash' => sha1($user->getEmailForVerification()),
        ],
    );

    $this->get($verificationUrl)->assertForbidden();
    expect($user->fresh()->hasVerifiedEmail())->toBeFalse();
});

test('api registration sends verification link for a new unverified account', function () {
    Notification::fake();

    $this->postJson('/api/auth/register', [
        'name' => 'Verify Link API User',
        'email' => 'verify-link-api@example.com',
        'password' => 'password123',
        'role' => 'user',
        'device_name' => 'test-device',
    ])
        ->assertCreated()
        ->assertJsonPath('requires_email_verification', true)
        ->assertJsonPath('verification_method', 'link')
        ->assertJsonStructure(['token', 'token_type', 'user', 'requires_email_verification', 'verification_method']);

    $user = User::query()->where('email', 'verify-link-api@example.com')->firstOrFail();

    expect(EmailOtp::query()->where('user_id', $user->id)->where('purpose', 'verify_email')->count())->toBe(0);
    Notification::assertSentTo(
        $user,
        VerifyEmailLinkNotification::class,
        fn (VerifyEmailLinkNotification $notification) => $notification->isForMobileApp(),
    );
});

test('api registration for existing unverified email sends a new verification link', function () {
    Notification::fake();

    $user = User::factory()->unverified()->create([
        'email' => 'verify-link-existing@example.com',
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
        'name' => 'Verify Link Existing User',
        'email' => $user->email,
        'password' => 'password123',
        'role' => 'user',
        'device_name' => 'test-device',
    ])
        ->assertCreated()
        ->assertJsonPath('requires_email_verification', true)
        ->assertJsonPath('verification_method', 'link');

    Notification::assertSentTo(
        $user,
        VerifyEmailLinkNotification::class,
        fn (VerifyEmailLinkNotification $notification) => $notification->isForMobileApp(),
    );
});
