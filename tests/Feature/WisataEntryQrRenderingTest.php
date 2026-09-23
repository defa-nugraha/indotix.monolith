<?php

use App\Support\QrCodeRenderer;
use App\Support\WisataEntryQrTemplate;
use Dompdf\Dompdf;
use Dompdf\Options;

it('renders a single A4 QR poster with branding and without a browser process', function (string $name, int $logoCount) {
    $image = fn (string $path) => 'data:image/jpeg;base64,'.base64_encode(file_get_contents(public_path($path)));
    $logo = $image('images/qr/print-logo.jpg');
    $html = view('mitra-wisata-entry-qr', [
        'destinationName' => $name,
        'qrImage' => QrCodeRenderer::dataUri(str_repeat('signed-merchant-qr-', 14), 520),
        'template' => [
            ...WisataEntryQrTemplate::defaults(),
            'top_logo_images' => array_fill(0, $logoCount, $logo),
            'qr_logo_image' => $logo,
            'background_image' => $image('images/qr/entry-mountain-print.jpg'),
            'playstore_image' => $image('images/qr/print-playstore.jpg'),
        ],
    ])->render();

    $options = new Options;
    $options->set('isRemoteEnabled', false);
    $pdf = new Dompdf($options);
    $pdf->setPaper('A4', 'portrait');
    $pdf->loadHtml($html, 'UTF-8');
    $pdf->render();

    expect($pdf->getCanvas()->get_page_count())->toBe(1)
        ->and($pdf->getCanvas()->get_width())->toBeGreaterThan(595)
        ->and($pdf->getCanvas()->get_width())->toBeLessThan(596)
        ->and($pdf->getCanvas()->get_height())->toBeGreaterThan(841)
        ->and($pdf->getCanvas()->get_height())->toBeLessThan(842)
        ->and($pdf->output())->toStartWith('%PDF-')
        ->and($pdf->output())->not->toContain('Image not found');
})->with([
    ['Wisata Demo Indotix', 1],
    ['Batu Lawang', 0],
    ['Taman Wisata Alam dan Rekreasi Keluarga Telaga Biru Majalengka', 3],
]);
