<?php

namespace App\Http\Controllers\Mitra;

use App\Http\Controllers\Controller;
use App\Mail\PartnerTermsSignedMail;
use App\Models\PartnerTermsDocument;
use App\Models\PartnerTermsSignature;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class PartnerTermsSignatureController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        $businessType = $user?->mitra_onboarding_type;

        abort_unless($businessType === 'wisata', 403);
        abort_unless($this->isVerified($request), 403);

        $data = $request->validate([
            'accepted' => ['accepted'],
        ]);

        $document = PartnerTermsDocument::query()
            ->where('business_type', $businessType)
            ->firstOrFail();

        $signature = PartnerTermsSignature::query()->updateOrCreate(
            [
                'partner_terms_document_id' => $document->id,
                'user_id' => $user->id,
            ],
            [
                'business_type' => $businessType,
                'signer_name' => $user->name,
                'signed_at' => now(),
            ]
        );

        Mail::to($user->email)->send(new PartnerTermsSignedMail($user, $document, $signature));

        $signature->update(['email_sent_at' => now()]);

        return back()->with('status', 'partner-terms-signed');
    }

    private function isVerified(Request $request): bool
    {
        $user = $request->user();

        return match ($user?->mitra_onboarding_type) {
            'wisata' => $user->mitraWisataOnboarding?->verification_status === 'verified',
            default => false,
        };
    }
}
