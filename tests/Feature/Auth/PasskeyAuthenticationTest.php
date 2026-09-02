<?php

use App\Models\User;
use App\Models\UserPasskey;
use App\Support\Base64Url;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    config()->set('services.passkeys.rp_id', 'indotix.test');
    config()->set('services.passkeys.rp_name', 'Indotix Test');
    config()->set('services.passkeys.origins', ['https://indotix.test']);
});

function passkeyCborLength(int $major, int $length): string
{
    if ($length < 24) {
        return chr(($major << 5) | $length);
    }
    if ($length < 256) {
        return chr(($major << 5) | 24).chr($length);
    }
    if ($length < 65536) {
        return chr(($major << 5) | 25).pack('n', $length);
    }

    return chr(($major << 5) | 26).pack('N', $length);
}

function passkeyCborInt(int $value): string
{
    if ($value >= 0) {
        return passkeyCborLength(0, $value);
    }

    return passkeyCborLength(1, -1 - $value);
}

function passkeyCborBytes(string $value): string
{
    return passkeyCborLength(2, strlen($value)).$value;
}

function passkeyCborText(string $value): string
{
    return passkeyCborLength(3, strlen($value)).$value;
}

function passkeyCborMap(array $items): string
{
    $encoded = passkeyCborLength(5, count($items));
    foreach ($items as $key => $value) {
        $encoded .= is_int($key) ? passkeyCborInt($key) : passkeyCborText((string) $key);
        $encoded .= match (true) {
            is_int($value) => passkeyCborInt($value),
            is_string($value) => passkeyCborBytes($value),
            is_array($value) => passkeyCborMap($value),
            default => throw new RuntimeException('Unsupported CBOR value.'),
        };
    }

    return $encoded;
}

function passkeyClientData(string $type, string $challenge, string $origin = 'https://indotix.test'): string
{
    return json_encode([
        'type' => $type,
        'challenge' => $challenge,
        'origin' => $origin,
    ], JSON_UNESCAPED_SLASHES);
}

function passkeyRegistrationCredential(
    string $challenge,
    string $credentialId,
    string $x,
    string $y,
    string $origin = 'https://indotix.test',
): array
{
    $cose = passkeyCborMap([
        1 => 2,
        3 => -7,
        -1 => 1,
        -2 => $x,
        -3 => $y,
    ]);
    $authData = hash('sha256', 'indotix.test', true)
        .chr(0x45)
        .pack('N', 1)
        .str_repeat("\0", 16)
        .pack('n', strlen($credentialId))
        .$credentialId
        .$cose;
    $attestationObject = passkeyCborMap([
        'fmt' => 'none',
        'authData' => $authData,
        'attStmt' => [],
    ]);

    return [
        'id' => Base64Url::encode($credentialId),
        'rawId' => Base64Url::encode($credentialId),
        'type' => 'public-key',
        'response' => [
            'clientDataJSON' => Base64Url::encode(passkeyClientData('webauthn.create', $challenge, $origin)),
            'attestationObject' => Base64Url::encode($attestationObject),
            'transports' => ['internal'],
        ],
    ];
}

function passkeyAuthenticationCredential(string $challenge, string $credentialId, OpenSSLAsymmetricKey $privateKey, int $signCount = 2): array
{
    $clientDataJson = passkeyClientData('webauthn.get', $challenge);
    $authData = hash('sha256', 'indotix.test', true).chr(0x05).pack('N', $signCount);
    openssl_sign($authData.hash('sha256', $clientDataJson, true), $signature, $privateKey, OPENSSL_ALGO_SHA256);

    return [
        'id' => Base64Url::encode($credentialId),
        'rawId' => Base64Url::encode($credentialId),
        'type' => 'public-key',
        'response' => [
            'clientDataJSON' => Base64Url::encode($clientDataJson),
            'authenticatorData' => Base64Url::encode($authData),
            'signature' => Base64Url::encode($signature),
        ],
    ];
}

it('registers a passkey and logs in with a verified WebAuthn assertion without storing a local token', function () {
    $user = User::factory()->create([
        'email_verified_at' => now(),
    ]);
    $token = $user->createToken('mobile')->plainTextToken;
    $key = openssl_pkey_new([
        'private_key_type' => OPENSSL_KEYTYPE_EC,
        'curve_name' => 'prime256v1',
    ]);
    $details = openssl_pkey_get_details($key);
    $credentialId = random_bytes(32);

    $options = $this->withToken($token)
        ->postJson('/api/auth/passkeys/register/options', [
            'label' => 'Pengenalan wajah',
        ])
        ->assertOk()
        ->json('publicKey');

    $this->withToken($token)
        ->postJson('/api/auth/passkeys/register', [
            'label' => 'Pengenalan wajah',
            'credential' => passkeyRegistrationCredential(
                $options['challenge'],
                $credentialId,
                $details['ec']['x'],
                $details['ec']['y'],
            ),
        ])
        ->assertCreated()
        ->assertJsonPath('passkey.label', 'Pengenalan wajah');

    expect(UserPasskey::query()->where('user_id', $user->id)->whereNull('revoked_at')->count())->toBe(1);

    $loginOptions = $this->postJson('/api/auth/passkeys/login/options')
        ->assertOk()
        ->json('publicKey');

    $this->postJson('/api/auth/passkeys/login', [
        'credential' => passkeyAuthenticationCredential($loginOptions['challenge'], $credentialId, $key, 2),
        'device_name' => 'mobile-passkey-test',
    ])
        ->assertOk()
        ->assertJsonPath('user.email', $user->email)
        ->assertJsonStructure(['token', 'user']);

    expect(UserPasskey::query()->first()->sign_count)->toBe(2);
});

it('rejects unknown passkeys and replayed assertion counters', function () {
    $user = User::factory()->create([
        'email_verified_at' => now(),
    ]);
    $key = openssl_pkey_new([
        'private_key_type' => OPENSSL_KEYTYPE_EC,
        'curve_name' => 'prime256v1',
    ]);
    $details = openssl_pkey_get_details($key);
    $credentialId = random_bytes(32);

    UserPasskey::query()->create([
        'user_id' => $user->id,
        'credential_id' => Base64Url::encode($credentialId),
        'label' => 'Sidik jari',
        'public_key_x' => Base64Url::encode($details['ec']['x']),
        'public_key_y' => Base64Url::encode($details['ec']['y']),
        'sign_count' => 5,
    ]);

    $unknownOptions = $this->postJson('/api/auth/passkeys/login/options')
        ->assertOk()
        ->json('publicKey');

    $this->postJson('/api/auth/passkeys/login', [
        'credential' => passkeyAuthenticationCredential($unknownOptions['challenge'], random_bytes(32), $key, 6),
    ])
        ->assertUnprocessable()
        ->assertJsonPath('message', 'Passkey tidak dikenal. Login manual lalu aktifkan ulang biometrik.');

    $replayOptions = $this->postJson('/api/auth/passkeys/login/options')
        ->assertOk()
        ->json('publicKey');

    $this->postJson('/api/auth/passkeys/login', [
        'credential' => passkeyAuthenticationCredential($replayOptions['challenge'], $credentialId, $key, 4),
    ])
        ->assertUnprocessable()
        ->assertJsonPath('message', 'Passkey ditolak karena terindikasi replay.');
});

it('does not expose passkey availability through login option email hints', function () {
    $user = User::factory()->create([
        'email_verified_at' => now(),
    ]);

    UserPasskey::query()->create([
        'user_id' => $user->id,
        'credential_id' => Base64Url::encode(random_bytes(32)),
        'label' => 'Pengenalan wajah',
        'public_key_x' => Base64Url::encode(str_repeat('a', 32)),
        'public_key_y' => Base64Url::encode(str_repeat('b', 32)),
        'sign_count' => 1,
    ]);

    $options = $this->postJson('/api/auth/passkeys/login/options', [
        'email' => $user->email,
    ])
        ->assertOk()
        ->json('publicKey');

    expect($options)->not->toHaveKey('allowCredentials');
});

it('accepts Android native passkey origins derived from the signing certificate fingerprint', function () {
    config()->set('services.passkeys.android_cert_fingerprints', [
        '00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF',
    ]);

    $androidOrigin = 'android:apk-key-hash:'.Base64Url::encode(hex2bin(
        '00112233445566778899AABBCCDDEEFF00112233445566778899AABBCCDDEEFF'
    ));
    $user = User::factory()->create([
        'email_verified_at' => now(),
    ]);
    $token = $user->createToken('mobile')->plainTextToken;
    $key = openssl_pkey_new([
        'private_key_type' => OPENSSL_KEYTYPE_EC,
        'curve_name' => 'prime256v1',
    ]);
    $details = openssl_pkey_get_details($key);
    $credentialId = random_bytes(32);

    $options = $this->withToken($token)
        ->postJson('/api/auth/passkeys/register/options', [
            'label' => 'Pengenalan wajah',
        ])
        ->assertOk()
        ->json('publicKey');

    $this->withToken($token)
        ->postJson('/api/auth/passkeys/register', [
            'label' => 'Pengenalan wajah',
            'credential' => passkeyRegistrationCredential(
                $options['challenge'],
                $credentialId,
                $details['ec']['x'],
                $details['ec']['y'],
                $androidOrigin,
            ),
        ])
        ->assertCreated();
});
