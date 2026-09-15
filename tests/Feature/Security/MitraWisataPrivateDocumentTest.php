<?php

use App\Http\Middleware\AddSecurityHeaders;
use App\Models\MitraWisataOnboarding;
use App\Models\User;
use App\Services\MediaCompressionService;
use App\Services\MitraWisataSensitiveDocumentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

function privateDocumentMitraFixture(): array
{
    $user = User::factory()->create([
        'role' => 'mitra',
        'email_verified_at' => now(),
        'mitra_onboarding_type' => 'wisata',
    ]);

    $destination = MitraWisataOnboarding::query()->create([
        'user_id' => $user->id,
        'destination_name' => 'Wisata Private Documents',
        'destination_type' => 'alam',
        'verification_status' => 'verified',
        'payout_status' => 'verified',
        'is_live' => true,
        'is_suspended' => false,
        'is_temporarily_closed' => false,
    ]);

    return [$user, $destination];
}

test('private mitra document is available only through authenticated protected route', function () {
    Storage::fake('local');
    Storage::fake('public');

    [$mitra, $destination] = privateDocumentMitraFixture();
    $path = "mitra-wisata-sensitive/{$mitra->id}/ktp-test.pdf";
    Storage::disk('local')->put($path, '%PDF-test');
    $destination->update(['ktp_path' => $path]);

    $this->get(route('mitra.wisata.documents.show', ['type' => 'ktp']))
        ->assertRedirect();

    $response = $this->actingAs($mitra)
        ->get(route('mitra.wisata.documents.show', ['type' => 'ktp']))
        ->assertOk();

    $cacheControl = (string) $response->headers->get('Cache-Control');
    expect($cacheControl)
        ->toContain('private')
        ->toContain('no-store')
        ->toContain('max-age=0')
        ->and(Storage::disk('public')->exists($path))->toBeFalse();
});

test('mitra cannot use protected document endpoint to access another partners file', function () {
    Storage::fake('local');

    [$owner, $ownerDestination] = privateDocumentMitraFixture();
    [$other] = privateDocumentMitraFixture();

    $path = "mitra-wisata-sensitive/{$owner->id}/ktp-owner.pdf";
    Storage::disk('local')->put($path, '%PDF-owner');
    $ownerDestination->update(['ktp_path' => $path]);

    $this->actingAs($other)
        ->get(route('mitra.wisata.documents.show', ['type' => 'ktp']))
        ->assertNotFound();
});

test('admin can access protected mitra document but normal user cannot', function () {
    Storage::fake('local');

    [$mitra, $destination] = privateDocumentMitraFixture();
    $path = "mitra-wisata-sensitive/{$mitra->id}/legal.pdf";
    Storage::disk('local')->put($path, '%PDF-legal');
    $destination->update(['legal_doc_path' => $path]);

    $admin = User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);
    $normal = User::factory()->create([
        'role' => 'user',
        'email_verified_at' => now(),
    ]);

    $this->actingAs($admin)
        ->get(route('admin.mitra-wisata.documents.show', ['user' => $mitra->id, 'type' => 'legal']))
        ->assertOk();

    $this->actingAs($normal)
        ->get(route('admin.mitra-wisata.documents.show', ['user' => $mitra->id, 'type' => 'legal']))
        ->assertRedirect(route('dashboard'));
});

test('legacy public identity document migration copies verifies updates then deletes public source', function () {
    Storage::fake('local');
    Storage::fake('public');

    [$mitra, $destination] = privateDocumentMitraFixture();
    $legacy = "mitra-wisata/{$mitra->id}/legacy-ktp.pdf";
    Storage::disk('public')->put($legacy, '%PDF-legacy');
    $destination->update(['ktp_path' => $legacy]);

    $service = new MitraWisataSensitiveDocumentService(new MediaCompressionService());
    $moved = $service->migrateLegacyRecord($destination->fresh());

    $newPath = (string) $destination->fresh()->ktp_path;

    expect($moved)->toBe(1)
        ->and($newPath)->toStartWith("mitra-wisata-sensitive/{$mitra->id}/")
        ->and(Storage::disk('local')->exists($newPath))->toBeTrue()
        ->and(Storage::disk('public')->exists($legacy))->toBeFalse()
        ->and(Storage::disk('public')->exists($newPath))->toBeFalse();
});

test('payment surface sends a restrictive content security policy', function () {
    $request = Request::create('/wisata/booking/test/payment', 'GET');
    $response = (new AddSecurityHeaders())->handle($request, fn () => response('ok'));

    $csp = (string) $response->headers->get('Content-Security-Policy');

    expect($csp)->toContain("default-src 'self'")
        ->toContain('https://app.midtrans.com')
        ->toContain("object-src 'none'")
        ->toContain("frame-ancestors 'self'")
        ->not->toContain('default-src *');
});
