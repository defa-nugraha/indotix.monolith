<?php

namespace App\Services;

use App\Models\WisataBooking;
use Dompdf\Dompdf;
use Dompdf\Options;

class WisataTicketPdfService
{
    public function render(WisataBooking $booking): string
    {
        $booking->loadMissing(['destination', 'ticket', 'items.ticket']);

        $options = new Options;
        $options->set('isRemoteEnabled', false);
        $options->set('isHtml5ParserEnabled', true);

        $logoPath = public_path('logo.png');
        $logoDataUri = null;

        if (is_file($logoPath) && is_readable($logoPath)) {
            $logoDataUri = 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath));
        }

        $pdf = new Dompdf($options);
        $pdf->setPaper('A4', 'portrait');
        $pdf->loadHtml(view('wisata-ticket', [
            'booking' => $booking,
            'logoDataUri' => $logoDataUri,
        ])->render(), 'UTF-8');
        $pdf->render();

        return $pdf->output();
    }
}
