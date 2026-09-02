<?php

namespace App\Mail;

use App\Models\WisataBooking;
use Illuminate\Mail\Mailable;
use Spatie\LaravelPdf\Facades\Pdf;

class WisataTicketMail extends Mailable
{
    public function __construct(public WisataBooking $booking) {}

    public function build(): self
    {
        $this->booking->loadMissing(['destination', 'ticket', 'items.ticket']);

        $pdf = Pdf::view('wisata-ticket', [
            'booking' => $this->booking,
        ])->base64();

        return $this
            ->subject('E-ticket Wisata Indotix '.$this->booking->booking_code)
            ->view('emails.wisata-ticket')
            ->attachData(base64_decode($pdf), 'e-ticket-wisata-'.$this->booking->booking_code.'.pdf', [
                'mime' => 'application/pdf',
            ]);
    }
}
