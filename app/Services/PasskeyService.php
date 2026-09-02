<?php

namespace App\Services;

use App\Models\PasskeyChallenge;
use App\Models\User;
use App\Models\UserPasskey;
use App\Support\Base64Url;
use App\Support\CborReader;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class PasskeyService
{
    private const CHALLENGE_TTL_MINUTES = 5;

    public function registrationOptions(User $user, Request $request, ?string $label = null): array
    {
        $challenge = $this->issueChallenge($request, 'register', $user);

        return [
            'challenge' => $challenge,
            'rp' => [
                'name' => $this->rpName(),
                'id' => $this->rpId(),
            ],
            'user' => [
                'id' => Base64Url::encode(hash('sha256', 'indotix-user-'.$user->id, true)),
                'name' => $user->email,
                'displayName' => $user->name,
            ],
            'pubKeyCredParams' => [
                ['type' => 'public-key', 'alg' => -7],
            ],
            'timeout' => 60000,
            'attestation' => 'none',
            'authenticatorSelection' => [
                'authenticatorAttachment' => 'platform',
                'residentKey' => 'required',
                'requireResidentKey' => true,
                'userVerification' => 'required',
            ],
            'excludeCredentials' => $user->passkeys()
                ->whereNull('revoked_at')
                ->get()
                ->map(fn (UserPasskey $passkey) => [
                    'type' => 'public-key',
                    'id' => $passkey->credential_id,
                    'transports' => $passkey->transports ?: ['internal', 'hybrid'],
                ])
                ->values()
                ->all(),
            'label' => $label,
        ];
    }

    public function verifyRegistration(User $user, Request $request, array $payload, ?string $label = null): UserPasskey
    {
        $clientDataJson = Base64Url::decode((string) data_get($payload, 'response.clientDataJSON', ''));
        $clientData = $this->validatedClientData($clientDataJson, 'webauthn.create');
        $this->consumeChallenge((string) $clientData['challenge'], 'register', $user);

        $attestationObject = Base64Url::decode((string) data_get($payload, 'response.attestationObject', ''));
        $attestation = (new CborReader($attestationObject))->read();

        if (! is_array($attestation) || ! isset($attestation['authData'])) {
            throw ValidationException::withMessages([
                'passkey' => 'Data passkey tidak valid.',
            ]);
        }

        $authData = $this->parseRegistrationAuthData($attestation['authData']);
        $expectedCredentialId = Base64Url::encode($authData['credential_id']);
        $rawId = (string) ($payload['rawId'] ?? $payload['id'] ?? '');

        if ($rawId !== '' && ! hash_equals($expectedCredentialId, $rawId)) {
            throw ValidationException::withMessages([
                'passkey' => 'Credential passkey tidak cocok.',
            ]);
        }

        if (UserPasskey::query()->where('credential_id', $expectedCredentialId)->whereNull('revoked_at')->exists()) {
            throw ValidationException::withMessages([
                'passkey' => 'Passkey ini sudah terdaftar.',
            ]);
        }

        return DB::transaction(function () use ($user, $payload, $label, $authData, $expectedCredentialId) {
            return UserPasskey::query()->create([
                'user_id' => $user->id,
                'credential_id' => $expectedCredentialId,
                'label' => $label ?: 'Login biometrik',
                'public_key_x' => Base64Url::encode($authData['x']),
                'public_key_y' => Base64Url::encode($authData['y']),
                'transports' => collect(data_get($payload, 'response.transports', []))
                    ->filter(fn ($transport) => is_string($transport) && $transport !== '')
                    ->values()
                    ->all(),
                'sign_count' => $authData['sign_count'],
            ]);
        });
    }

    public function authenticationOptions(Request $request): array
    {
        $challenge = $this->issueChallenge($request, 'authenticate');

        return [
            'challenge' => $challenge,
            'rpId' => $this->rpId(),
            'timeout' => 60000,
            'userVerification' => 'required',
        ];
    }

    public function verifyAuthentication(Request $request, array $payload): User
    {
        $credentialId = (string) ($payload['rawId'] ?? $payload['id'] ?? '');
        $passkey = UserPasskey::query()
            ->with('user')
            ->where('credential_id', $credentialId)
            ->whereNull('revoked_at')
            ->first();

        if (! $passkey || ! $passkey->user) {
            throw ValidationException::withMessages([
                'passkey' => 'Passkey tidak dikenal. Login manual lalu aktifkan ulang biometrik.',
            ]);
        }

        $clientDataJson = Base64Url::decode((string) data_get($payload, 'response.clientDataJSON', ''));
        $clientData = $this->validatedClientData($clientDataJson, 'webauthn.get');
        $challenge = $this->consumeChallenge((string) $clientData['challenge'], 'authenticate');

        if ($challenge->user_id !== null && (int) $challenge->user_id !== (int) $passkey->user_id) {
            throw ValidationException::withMessages([
                'passkey' => 'Passkey tidak cocok dengan akun ini.',
            ]);
        }

        $authenticatorData = Base64Url::decode((string) data_get($payload, 'response.authenticatorData', ''));
        $signature = Base64Url::decode((string) data_get($payload, 'response.signature', ''));
        $auth = $this->parseAuthenticationData($authenticatorData);

        $publicKey = $this->publicKeyPem(
            Base64Url::decode($passkey->public_key_x),
            Base64Url::decode($passkey->public_key_y)
        );
        $signedData = $authenticatorData.hash('sha256', $clientDataJson, true);

        if (openssl_verify($signedData, $signature, $publicKey, OPENSSL_ALGO_SHA256) !== 1) {
            throw ValidationException::withMessages([
                'passkey' => 'Verifikasi passkey gagal.',
            ]);
        }

        if ($auth['sign_count'] > 0 && $passkey->sign_count > 0 && $auth['sign_count'] <= $passkey->sign_count) {
            throw ValidationException::withMessages([
                'passkey' => 'Passkey ditolak karena terindikasi replay.',
            ]);
        }

        $passkey->forceFill([
            'sign_count' => max((int) $passkey->sign_count, $auth['sign_count']),
            'last_used_at' => now(),
        ])->save();

        return $passkey->user;
    }

    private function issueChallenge(Request $request, string $purpose, ?User $user = null): string
    {
        PasskeyChallenge::query()
            ->where('expires_at', '<', now())
            ->orWhereNotNull('consumed_at')
            ->delete();

        $challenge = Base64Url::encode(random_bytes(32));

        PasskeyChallenge::query()->create([
            'user_id' => $user?->id,
            'purpose' => $purpose,
            'challenge_hash' => hash('sha256', $challenge),
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 1000),
            'expires_at' => now()->addMinutes(self::CHALLENGE_TTL_MINUTES),
        ]);

        return $challenge;
    }

    private function consumeChallenge(string $challenge, string $purpose, ?User $user = null): PasskeyChallenge
    {
        $query = PasskeyChallenge::query()
            ->where('purpose', $purpose)
            ->where('challenge_hash', hash('sha256', $challenge))
            ->whereNull('consumed_at')
            ->where('expires_at', '>', now());

        if ($user) {
            $query->where('user_id', $user->id);
        }

        $record = $query->first();

        if (! $record) {
            throw ValidationException::withMessages([
                'passkey' => 'Challenge passkey tidak valid atau sudah kedaluwarsa.',
            ]);
        }

        $record->forceFill(['consumed_at' => now()])->save();

        return $record;
    }

    private function validatedClientData(string $clientDataJson, string $expectedType): array
    {
        $clientData = json_decode($clientDataJson, true);
        if (! is_array($clientData)) {
            throw ValidationException::withMessages([
                'passkey' => 'Client data passkey tidak valid.',
            ]);
        }

        if (($clientData['type'] ?? null) !== $expectedType || empty($clientData['challenge'])) {
            throw ValidationException::withMessages([
                'passkey' => 'Tipe client data passkey tidak sesuai.',
            ]);
        }

        if (! $this->originAllowed((string) ($clientData['origin'] ?? ''))) {
            throw ValidationException::withMessages([
                'passkey' => 'Origin passkey tidak diizinkan.',
            ]);
        }

        return $clientData;
    }

    private function parseRegistrationAuthData(string $authData): array
    {
        $parsed = $this->parseAuthenticatorDataHeader($authData);
        if (! $parsed['attested']) {
            throw ValidationException::withMessages([
                'passkey' => 'Data credential passkey tidak ditemukan.',
            ]);
        }

        $offset = 37;
        $offset += 16;
        $credentialIdLength = unpack('n', substr($authData, $offset, 2))[1] ?? 0;
        $offset += 2;
        $credentialId = substr($authData, $offset, $credentialIdLength);
        $offset += $credentialIdLength;
        $credentialPublicKey = substr($authData, $offset);
        $coseKey = (new CborReader($credentialPublicKey))->read();

        if (! is_array($coseKey) || ($coseKey[1] ?? null) !== 2 || ($coseKey[3] ?? null) !== -7 || ($coseKey[-1] ?? null) !== 1) {
            throw ValidationException::withMessages([
                'passkey' => 'Tipe public key passkey belum didukung.',
            ]);
        }

        $x = (string) ($coseKey[-2] ?? '');
        $y = (string) ($coseKey[-3] ?? '');
        if (strlen($credentialId) < 16 || strlen($x) !== 32 || strlen($y) !== 32) {
            throw ValidationException::withMessages([
                'passkey' => 'Ukuran public key passkey tidak valid.',
            ]);
        }

        return [
            'credential_id' => $credentialId,
            'x' => $x,
            'y' => $y,
            'sign_count' => $parsed['sign_count'],
        ];
    }

    private function parseAuthenticationData(string $authData): array
    {
        return $this->parseAuthenticatorDataHeader($authData);
    }

    private function parseAuthenticatorDataHeader(string $authData): array
    {
        if (strlen($authData) < 37) {
            throw ValidationException::withMessages([
                'passkey' => 'Authenticator data passkey tidak valid.',
            ]);
        }

        if (! hash_equals(hash('sha256', $this->rpId(), true), substr($authData, 0, 32))) {
            throw ValidationException::withMessages([
                'passkey' => 'Relying party passkey tidak cocok.',
            ]);
        }

        $flags = ord($authData[32]);
        if (($flags & 0x01) === 0 || ($flags & 0x04) === 0) {
            throw ValidationException::withMessages([
                'passkey' => 'Passkey harus diverifikasi dengan biometrik perangkat.',
            ]);
        }

        return [
            'flags' => $flags,
            'attested' => ($flags & 0x40) !== 0,
            'sign_count' => unpack('N', substr($authData, 33, 4))[1] ?? 0,
        ];
    }

    private function originAllowed(string $origin): bool
    {
        $allowed = array_merge(
            array_map('strval', config('services.passkeys.origins', [])),
            $this->androidAllowedOrigins()
        );

        return in_array($origin, $allowed, true);
    }

    private function androidAllowedOrigins(): array
    {
        $origins = [];

        foreach ((array) config('services.passkeys.android_cert_fingerprints', []) as $fingerprint) {
            $value = trim((string) $fingerprint);
            if ($value === '') {
                continue;
            }

            if (str_starts_with($value, 'android:apk-key-hash:')) {
                $origins[] = $value;
                continue;
            }

            $hex = preg_replace('/[^A-Fa-f0-9]/', '', $value) ?? '';
            if (strlen($hex) === 64) {
                $hash = hex2bin($hex);
                if ($hash !== false) {
                    $origins[] = 'android:apk-key-hash:'.Base64Url::encode($hash);
                }
                continue;
            }

            if (preg_match('/^[A-Za-z0-9_-]{43}$/', $value) === 1) {
                $origins[] = 'android:apk-key-hash:'.$value;
            }
        }

        return array_values(array_unique($origins));
    }

    private function rpId(): string
    {
        return (string) config('services.passkeys.rp_id', 'indotix.co.id');
    }

    private function rpName(): string
    {
        return (string) config('services.passkeys.rp_name', 'Indotix');
    }

    private function publicKeyPem(string $x, string $y): string
    {
        if (strlen($x) !== 32 || strlen($y) !== 32) {
            throw new RuntimeException('Invalid P-256 public key.');
        }

        $algorithm = $this->derSequence(
            $this->derObjectIdentifier("\x2A\x86\x48\xCE\x3D\x02\x01").
            $this->derObjectIdentifier("\x2A\x86\x48\xCE\x3D\x03\x01\x07")
        );
        $subjectPublicKeyInfo = $this->derSequence($algorithm.$this->derBitString("\x04".$x.$y));

        return "-----BEGIN PUBLIC KEY-----\n".
            chunk_split(base64_encode($subjectPublicKeyInfo), 64, "\n").
            "-----END PUBLIC KEY-----\n";
    }

    private function derSequence(string $value): string
    {
        return "\x30".$this->derLength(strlen($value)).$value;
    }

    private function derObjectIdentifier(string $value): string
    {
        return "\x06".$this->derLength(strlen($value)).$value;
    }

    private function derBitString(string $value): string
    {
        return "\x03".$this->derLength(strlen($value) + 1)."\x00".$value;
    }

    private function derLength(int $length): string
    {
        if ($length < 128) {
            return chr($length);
        }

        $bytes = '';
        while ($length > 0) {
            $bytes = chr($length & 0xff).$bytes;
            $length >>= 8;
        }

        return chr(0x80 | strlen($bytes)).$bytes;
    }
}
