<?php

namespace App\Mail;

use App\Models\WisataBooking;
use App\Services\WisataTicketPdfService;
use Illuminate\Mail\Mailable;

class WisataTicketMail extends Mailable
{
    public function __construct(public WisataBooking $booking) {}

    public function build(): self
    {
        $this->booking->loadMissing(['destination', 'ticket', 'items.ticket']);

        $pdf = app(WisataTicketPdfService::class)->render($this->booking);

        return $this
            ->subject('E-ticket Wisata Indotix '.$this->booking->booking_code)
            ->view('emails.wisata-ticket')
            ->attachData($pdf, 'e-ticket-wisata-'.$this->booking->booking_code.'.pdf', [
                'mime' => 'application/pdf',
            ]);
    }
}
