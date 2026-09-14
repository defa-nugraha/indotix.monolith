<?php

use App\Models\AdminPermission;
use App\Models\AdminRole;
use App\Models\MitraWisataOnboarding;
use App\Models\PublicBanner;
use App\Models\User;
use App\Models\WisataTicket;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

test('sequential banner deletion only removes selected records and their files', function () {
    Storage::fake('public');
    $admin = User::factory()->create(['role' => 'admin']);
    $banners = collect(range(1, 3))->map(function ($id) {
        Storage::disk('public')->put("banners/{$id}.png", 'image');

        return PublicBanner::create(['title' => "Banner {$id}", 'image_path' => "banners/{$id}.png"]);
    });
    foreach ([$banners[0], $banners[2]] as $banner) {
        $this->actingAs($admin)->from('/admin/public/banners')->delete("/admin/public/banners/{$banner->id}")
            ->assertRedirect('/admin/public/banners')->assertSessionHasNoErrors();
        $this->assertModelMissing($banner);
        Storage::disk('public')->assertMissing($banner->image_path);
    }
    $this->assertModelExists($banners[1]);
    Storage::disk('public')->assertExists($banners[1]->image_path);
});

test('sequential deletion continues to enforce permission on every request', function () {
    $role = AdminRole::create(['name' => 'Content operator', 'slug' => 'bulk-content-operator', 'is_active' => true]);
    $permission = AdminPermission::firstOrCreate(['feature' => 'public_banners', 'action' => 'view'], ['label' => 'View banners']);
    $role->permissions()->sync([$permission->id]);
    $user = User::factory()->create(['role' => 'admin_custom', 'admin_role_id' => $role->id]);
    foreach (range(1, 2) as $id) {
        $banner = PublicBanner::create(['title' => "Banner {$id}", 'image_path' => 'banner.png']);
        $this->actingAs($user)->delete("/admin/public/banners/{$banner->id}")->assertForbidden();
        $this->assertModelExists($banner);
    }
});

test('destination dependencies and ticket deletion reasons remain enforced', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $owner = User::factory()->create(['role' => 'mitra', 'mitra_onboarding_type' => 'wisata']);
    $destination = MitraWisataOnboarding::create([
        'user_id' => $owner->id, 'destination_name' => 'Protected destination', 'destination_type' => 'alam',
    ]);
    $ticket = WisataTicket::create([
        'mitra_wisata_onboarding_id' => $destination->id, 'name' => 'Entry', 'price' => 10000, 'quota' => 10,
    ]);
    $this->actingAs($admin)->delete("/admin/wisata/destinations/{$destination->id}")->assertSessionHasErrors('destination');
    $this->assertModelExists($destination);
    $this->delete("/admin/wisata/tickets/{$ticket->id}")->assertSessionHasErrors('reason');
    $this->assertModelExists($ticket);
    $this->delete("/admin/wisata/tickets/{$ticket->id}", ['reason' => 'Tiket tidak dipakai'])
        ->assertSessionHas('status', 'ticket-deleted');
    expect(WisataTicket::find($ticket->id))->toBeNull();
});
