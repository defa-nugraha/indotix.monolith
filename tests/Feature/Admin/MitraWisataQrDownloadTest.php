<?php

use App\Models\AdminPermission;
use App\Models\AdminRole;
use App\Models\MitraWisataOnboarding;
use App\Models\User;
use App\Services\WisataTicketUsageService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery\MockInterface;

uses(RefreshDatabase::class);

function qrDownloadMitra(string $name): array
{
    $user = User::factory()->create([
        'name' => $name,
        'role' => 'mitra',
        'mitra_onboarding_type' => 'wisata',
    ]);
    $destination = MitraWisataOnboarding::query()->create([
        'user_id' => $user->id,
        'destination_name' => $name,
        'destination_type' => 'alam',
    ]);

    return [$user, $destination];
}

it('downloads qr only for selected mitra wisata', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    [$firstSelectedUser, $firstSelectedDestination] = qrDownloadMitra('Wisata Terpilih Satu');
    [$secondSelectedUser, $secondSelectedDestination] = qrDownloadMitra('Wisata Terpilih Dua');
    [, $unselectedDestination] = qrDownloadMitra('Wisata Tidak Terpilih');
    $renderedDestinationIds = [];

    $this->mock(WisataTicketUsageService::class, function (MockInterface $mock) use (&$renderedDestinationIds) {
        $mock->shouldReceive('buildMerchantQrData')
            ->twice()
            ->andReturnUsing(function (MitraWisataOnboarding $destination) use (&$renderedDestinationIds) {
                $renderedDestinationIds[] = $destination->id;

                return 'INDOTIX|WISATA_GATE|selected';
            });
    });

    $response = $this->actingAs($admin)->get(route('admin.mitra-wisata.qr-download', [
        'ids' => [$firstSelectedUser->id, $secondSelectedUser->id],
    ]));

    $response->assertOk()
        ->assertHeader('Content-Type', 'application/pdf')
        ->assertHeader('X-Content-Type-Options', 'nosniff');

    expect($response->headers->get('Content-Disposition'))
        ->toContain('attachment; filename="qr-masuk-mitra-wisata-2.pdf"')
        ->and($response->headers->get('Cache-Control'))->toContain('private')
        ->and($response->headers->get('Cache-Control'))->toContain('no-store')
        ->and($response->headers->get('Cache-Control'))->toContain('max-age=0')
        ->and(substr($response->getContent(), 0, 4))->toBe('%PDF')
        ->and($renderedDestinationIds)->toBe([
            $firstSelectedDestination->id,
            $secondSelectedDestination->id,
        ])
        ->and($renderedDestinationIds)->not->toContain($unselectedDestination->id);
});

it('rejects empty and invalid qr selections', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $hotelMitra = User::factory()->create([
        'role' => 'mitra',
        'mitra_onboarding_type' => 'hotel',
    ]);

    $this->actingAs($admin)
        ->getJson(route('admin.mitra-wisata.qr-download'))
        ->assertUnprocessable()
        ->assertJsonValidationErrors('ids');

    $this->actingAs($admin)
        ->getJson(route('admin.mitra-wisata.qr-download', ['ids' => [$hotelMitra->id]]))
        ->assertUnprocessable()
        ->assertJsonValidationErrors('ids');
});

it('enforces mitra wisata view permission for qr downloads', function () {
    [$mitra] = qrDownloadMitra('Wisata Terbatas');
    $role = AdminRole::query()->create([
        'name' => 'Admin tanpa akses mitra',
        'slug' => 'admin-tanpa-akses-mitra',
        'is_active' => true,
    ]);
    $permission = AdminPermission::query()->firstOrCreate(
        ['feature' => 'public_banners', 'action' => 'view'],
        ['label' => 'Lihat banner'],
    );
    $role->permissions()->sync([$permission->id]);
    $customAdmin = User::factory()->create([
        'role' => 'admin_custom',
        'admin_role_id' => $role->id,
    ]);

    $this->actingAs($customAdmin)
        ->get(route('admin.mitra-wisata.qr-download', ['ids' => [$mitra->id]]))
        ->assertForbidden();
});
