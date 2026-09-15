<?php

require dirname(__DIR__, 3).'/vendor/autoload.php';
$_SERVER['LARAVEL_STORAGE_PATH'] = '/tmp/indotix-guide-storage';
$app = require dirname(__DIR__, 3).'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
if (! $app->environment('local') || config('database.connections.mysql.database') !== 'indotix_user_guide'
    || config('database.connections.mysql.host') !== '127.0.0.1'
    || (int) config('database.connections.mysql.port') !== 13316) {
    throw new RuntimeException('Dedicated local documentation database required.');
}
$owner = App\Models\User::where('email', 'pengelola@example.com')->firstOrFail();
$document = getenv('GUIDE_TERMS_PDF');
if (! $document || ! is_file($document)) {
    throw new RuntimeException('GUIDE_TERMS_PDF must point to the existing public partner terms PDF.');
}
Illuminate\Support\Facades\Storage::disk('public')->put('guide/partner-terms.pdf', file_get_contents($document));
App\Models\PartnerTermsDocument::updateOrCreate(['business_type' => 'wisata'], [
    'title' => 'Syarat dan Ketentuan Mitra Wisata INDOTIX',
    'file_path' => 'guide/partner-terms.pdf',
]);
if (getenv('GUIDE_PREPARE_DRAFT') === 'true') {
    $user = App\Models\User::where('email', getenv('GUIDE_REGISTRATION_EMAIL'))->firstOrFail();
    $source = $owner->mitraWisataOnboarding;
    $draft = $user->mitraWisataOnboarding;
    if (! $draft || $draft->verification_status !== 'draft') {
        throw new RuntimeException('Only a documentation draft may be prepared.');
    }
    $values = collect($source->attributesToArray())->except(['id', 'user_id', 'created_at', 'updated_at'])->all();
    // Non-sensitive fixture documents, never an actual identity card or business permit.
    $values = array_merge($values, [
        'responsible_name' => 'Pengelola Wisata Baru', 'destination_name' => 'Wisata Telaga Keluarga',
        'verification_status' => 'draft', 'payout_status' => 'draft', 'is_live' => false,
        'ktp_path' => 'guide/partner-terms.pdf', 'legal_doc_path' => 'guide/partner-terms.pdf',
    ]);
    $draft->forceFill($values)->save();
}
echo "Additional local documentation fixtures prepared.\n";
