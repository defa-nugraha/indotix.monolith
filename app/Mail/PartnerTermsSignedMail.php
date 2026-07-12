<?php

namespace App\Mail;

use App\Models\PartnerTermsDocument;
use App\Models\PartnerTermsSignature;
use App\Models\User;
use Illuminate\Mail\Mailable;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PartnerTermsSignedMail extends Mailable
{
    public function __construct(
        public User $user,
        public PartnerTermsDocument $document,
        public PartnerTermsSignature $signature
    ) {}

    public function build(): self
    {
        $mail = $this->subject('Dokumen Syarat & Ketentuan Mitra Indotix')
            ->view('emails.partner-terms-signed');

        if ($this->document->file_path && Storage::disk('public')->exists($this->document->file_path)) {
            $mail->attach(
                Storage::disk('public')->path($this->document->file_path),
                [
                    'as' => Str::slug($this->document->title).'.pdf',
                    'mime' => 'application/pdf',
                ]
            );
        }

        return $mail;
    }
}
