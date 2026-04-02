<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PasswordResetOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $name,
        public string $code,
        public int $expiresMinutes,
    ) {}

    public function build(): self
    {
        return $this
            ->subject('Kode OTP Reset Password')
            ->view('emails.password-reset-otp')
            ->with([
                'name' => $this->name,
                'code' => $this->code,
                'expiresMinutes' => $this->expiresMinutes,
            ]);
    }
}
