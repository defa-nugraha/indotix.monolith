<?php

use App\Mail\PartnerTermsSignedMail;
use App\Models\MitraWisataOnboarding;
use App\Models\PartnerTermsDocument;
use App\Models\PartnerTermsSignature;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('admin can upload partner terms pdf per business category', function () {
    Storage::fake('public');

    $admin = User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);

    $this->actingAs($admin)
        ->post('/admin/mitra-documents', [
            'business_type' => 'wisata',
            'title' => 'S&K Mitra Wisata',
            'document' => UploadedFile::fake()->create('terms.pdf', 128, 'application/pdf'),
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $document = PartnerTermsDocument::query()->where('business_type', 'wisata')->firstOrFail();

    expect($document->title)->toBe('S&K Mitra Wisata')
        ->and($document->uploaded_by)->toBe($admin->id)
        ->and($document->file_path)->toEndWith('.pdf');

    Storage::disk('public')->assertExists($document->file_path);
});

test('admin terms document upload only accepts pdf', function () {
    Storage::fake('public');

    $admin = User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);

    $this->actingAs($admin)
        ->post('/admin/mitra-documents', [
            'business_type' => 'wisata',
            'title' => 'S&K Mitra Wisata',
            'document' => fakeTestImage('terms.png'),
        ])
        ->assertSessionHasErrors('document');
});

test('admin can view partner terms pdf inline', function () {
    Storage::fake('public');

    $admin = User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);

    $path = UploadedFile::fake()
        ->create('terms.pdf', 128, 'application/pdf')
        ->store('partner-terms', 'public');

    $document = PartnerTermsDocument::query()->create([
        'business_type' => 'wisata',
        'title' => 'S&K Mitra Wisata',
        'file_path' => $path,
        'uploaded_by' => $admin->id,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.mitra-documents.file', $document))
        ->assertOk()
        ->assertHeader('Content-Type', 'application/pdf')
        ->assertHeader('Content-Disposition', 'inline; filename="'.basename($path).'"');
});

test('verified partner sees terms requirement and can sign it', function () {
    Storage::fake('public');
    Mail::fake();

    $mitra = User::factory()->create([
        'role' => 'mitra',
        'mitra_onboarding_type' => 'wisata',
        'email_verified_at' => now(),
    ]);

    MitraWisataOnboarding::query()->create([
        'user_id' => $mitra->id,
        'current_step' => 3,
        'verification_status' => 'verified',
        'payout_status' => 'verified',
    ]);

    $path = UploadedFile::fake()
        ->create('terms.pdf', 128, 'application/pdf')
        ->store('partner-terms', 'public');

    $document = PartnerTermsDocument::query()->create([
        'business_type' => 'wisata',
        'title' => 'S&K Mitra Wisata',
        'file_path' => $path,
    ]);

    $this->actingAs($mitra)
        ->get('/mitra/dashboard')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('termsRequirement.required', true)
            ->where('termsRequirement.business_type', 'wisata')
            ->where('termsRequirement.title', 'S&K Mitra Wisata'));

    $this->actingAs($mitra)
        ->post('/mitra/terms/sign', [
            'accepted' => true,
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $signature = PartnerTermsSignature::query()
        ->where('partner_terms_document_id', $document->id)
        ->where('user_id', $mitra->id)
        ->firstOrFail();

    expect($signature->signer_name)->toBe($mitra->name)
        ->and($signature->email_sent_at)->not->toBeNull();

    Mail::assertSent(PartnerTermsSignedMail::class, 1);
});
