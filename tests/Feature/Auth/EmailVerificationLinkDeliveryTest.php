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
        'phone' => '081234567890',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'role' => 'user',
        'terms_accepted' => '1',
    ])->assertRedirect(route('verification.notice'));

    $user = User::query()->where('email', $email)->firstOrFail();

    expect($user->hasVerifiedEmail())->toBeFalse();
    expect(EmailOtp::query()->where('user_id', $user->id)->where('purpose', 'verify_email')->count())->toBe(0);
    expect(EmailOtp::query()->where('user_id', $user->id)->where('purpose', 'verify_email')->count())->toBe(0);
    Notification::assertSentTo(
        $user,
        VerifyEmailLinkNotification::class,
        function (VerifyEmailLinkNotification $notification) use ($user) {
            $verificationUrl = $notification->toMail($user)->viewData['verificationUrl'];

            return ! $notification->isForMobileApp()
                && str_contains($verificationUrl, '/email/verify-link/');
        },
    );
});

test('web signed link verifies email without browser authentication', function () {
    Event::fake();

    $user = User::factory()->unverified()->create();
    $verificationUrl = URL::temporarySignedRoute(
        'public.verification.verify',
        now()->addMinutes(60),
        [
            'id' => $user->id,
            'hash' => sha1($user->getEmailForVerification()),
        ],
    );

    $this->get($verificationUrl)
        ->assertOk()
        ->assertSee('Email berhasil diverifikasi')
        ->assertSee('Masuk ke Indotix');

    expect(auth()->check())->toBeFalse();
    expect($user->fresh()->hasVerifiedEmail())->toBeTrue();
    Event::assertDispatched(Verified::class);
});

test('web verification link rejects a mismatched email hash', function () {
    Event::fake();

    $user = User::factory()->unverified()->create();
    $verificationUrl = URL::temporarySignedRoute(
        'public.verification.verify',
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
        'phone' => '081234567890',
        'password' => 'password123',
        'terms_accepted' => true,
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

test('api registration rejects an existing unverified email without mutating the account', function () {
    Notification::fake();

    $user = User::factory()->unverified()->create([
        'email' => 'verify-link-existing@example.com',
        'phone' => '081200000001',
    ]);
    $originalPassword = $user->password;

    EmailOtp::query()->create([
        'user_id' => $user->id,
        'email' => $user->email,
        'purpose' => 'verify_email',
        'code_hash' => bcrypt('111111'),
        'expires_at' => now()->addMinutes(10),
        'attempts' => 0,
    ]);

    $this->postJson('/api/auth/register', [
        'name' => 'Attacker Controlled Name',
        'email' => $user->email,
        'phone' => '081299999999',
        'password' => 'attacker-password',
        'terms_accepted' => true,
        'role' => 'user',
        'device_name' => 'attacker-device',
    ])
        ->assertUnprocessable()
        ->assertJsonPath('message', 'Email sudah terdaftar. Silakan login untuk melanjutkan verifikasi.')
        ->assertJsonMissingPath('token');

    $fresh = $user->fresh();

    expect($fresh->phone)->toBe('081200000001')
        ->and($fresh->password)->toBe($originalPassword)
        ->and($fresh->hasVerifiedEmail())->toBeFalse()
        ->and(EmailOtp::query()->where('user_id', $user->id)->where('purpose', 'verify_email')->count())->toBe(1);

    Notification::assertNothingSent();
});

test('api registration requires legal acceptance', function () {
    $this->postJson('/api/auth/register', [
        'name' => 'API Legal Acceptance User',
        'email' => 'api-legal-acceptance@example.com',
        'phone' => '081234567890',
        'password' => 'password123',
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('terms_accepted');

    expect(User::query()->where('email', 'api-legal-acceptance@example.com')->exists())->toBeFalse();
});
