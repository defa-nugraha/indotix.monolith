<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\URL;

class VerifyEmailLinkNotification extends VerifyEmail
{
    public function __construct(
        private readonly bool $forMobileApp = false,
    ) {}

    public function toMail($notifiable): MailMessage
    {
        $verificationUrl = $this->verificationUrl($notifiable);

        return (new MailMessage)
            ->subject('Verifikasi email akun Indotix')
            ->view('emails.verify-email', [
                'name' => $notifiable->name,
                'email' => $notifiable->getEmailForVerification(),
                'verificationUrl' => $verificationUrl,
                'logoUrl' => asset('logo.png'),
                'expiresMinutes' => (int) config('auth.verification.expire', 60),
                'forMobileApp' => $this->forMobileApp,
            ]);
    }

    public function isForMobileApp(): bool
    {
        return $this->forMobileApp;
    }

    protected function verificationUrl($notifiable): string
    {
        return URL::temporarySignedRoute(
            $this->forMobileApp
                ? 'mobile.verification.verify'
                : 'public.verification.verify',
            now()->addMinutes((int) config('auth.verification.expire', 60)),
            [
                'id' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ],
        );
    }
}
