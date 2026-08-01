<?php

use App\Models\MobileErrorLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;

uses(RefreshDatabase::class);

test('mobile app can report error before login', function () {
    Log::shouldReceive('warning')->once();

    $this->postJson('/api/mobile/errors', [
        'message' => 'NoSuchMethodError: receiver was null',
        'exception_type' => 'NoSuchMethodError',
        'stack_trace' => '#0 Example.build',
        'context' => 'flutter_error',
        'source' => 'flutter',
        'platform' => 'android',
        'app_version' => '1.0.0',
        'build_number' => '10',
        'fatal' => true,
        'device' => ['locale' => 'id_ID'],
        'extra' => ['screen' => 'LoginScreen'],
    ])
        ->assertCreated()
        ->assertJsonStructure(['message', 'id']);

    $this->assertDatabaseHas('mobile_error_logs', [
        'user_id' => null,
        'message' => 'NoSuchMethodError: receiver was null',
        'exception_type' => 'NoSuchMethodError',
        'context' => 'flutter_error',
        'platform' => 'android',
        'fatal' => true,
    ]);
});

test('mobile app error report stores authenticated user when token exists', function () {
    $user = User::factory()->create();

    Log::shouldReceive('warning')->once();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/mobile/errors', [
            'message' => 'HTTP 500 POST /api/hotel/bookings/quote',
            'exception_type' => 'String',
            'context' => 'HotelBookingService.http',
            'source' => 'flutter',
            'platform' => 'android',
            'fatal' => false,
        ])
        ->assertCreated();

    expect(MobileErrorLog::query()->where('user_id', $user->id)->exists())->toBeTrue();
});

test('mobile error endpoint redacts sensitive payload before storage', function () {
    Log::shouldReceive('warning')->once();

    $this->postJson('/api/mobile/errors', [
        'message' => 'HTTP 500 token=plain-secret Authorization: Bearer abc.def',
        'exception_type' => 'String',
        'context' => 'AuthService.http',
        'source' => 'flutter',
        'platform' => 'android',
        'extra' => [
            'email' => 'user@example.test',
            'response_body' => '{"access_token":"secret","message":"gagal"}',
            'nested' => [
                'refresh_token' => 'refresh-secret',
                'status' => 500,
            ],
        ],
    ])->assertCreated();

    $log = MobileErrorLog::query()->latest('id')->firstOrFail();

    expect($log->message)->not->toContain('plain-secret')
        ->and($log->message)->not->toContain('abc.def')
        ->and($log->extra['email'])->toBe('[redacted]')
        ->and($log->extra['response_body'])->not->toContain('secret')
        ->and($log->extra['nested']['refresh_token'])->toBe('[redacted]')
        ->and($log->extra['nested']['status'])->toBe(500);
});
