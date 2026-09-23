<?php

namespace App\Http\Controllers\Mitra\Wisata;

use App\Http\Controllers\Controller;
use App\Models\MitraWisataOnboarding;
use App\Models\WisataTicketScan;
use App\Services\WisataTicketUsageService;
use App\Support\PaginationOptions;
use App\Support\QrCodeRenderer;
use App\Support\WisataEntryQrTemplate;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ScanController extends Controller
{
    public function index(Request $request, WisataTicketUsageService $usageService): Response
    {
        $destination = MitraWisataOnboarding::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $qrData = $usageService->buildMerchantQrData($destination);

        $query = WisataTicketScan::query()
            ->with(['booking.ticket', 'item'])
            ->whereHas('booking', fn ($builder) => $builder->where('mitra_wisata_onboarding_id', $destination->id));

        if ($date = $request->string('date')->toString()) {
            $query->whereDate('scanned_at', $date);
        }

        if ($search = trim($request->string('search')->toString())) {
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('officer_name', 'like', '%'.$search.'%')
                    ->orWhere('location', 'like', '%'.$search.'%')
                    ->orWhereHas('booking', function ($bookingQuery) use ($search) {
                        $bookingQuery
                            ->where('booking_code', 'like', '%'.$search.'%')
                            ->orWhere('guest_name', 'like', '%'.$search.'%')
                            ->orWhere('guest_email', 'like', '%'.$search.'%');
                    })
                    ->orWhereHas('item', fn ($itemQuery) => $itemQuery->where('ticket_name', 'like', '%'.$search.'%'));
            });
        }

        $scans = $query->latest('scanned_at')
            ->paginate(PaginationOptions::perPage())
            ->withQueryString()
            ->through(fn (WisataTicketScan $scan) => [
                'id' => $scan->id,
                'scanned_at' => $scan->scanned_at?->format('Y-m-d H:i'),
                'officer_name' => $scan->officer_name,
                'location' => $scan->location,
                'is_anomaly' => $scan->is_anomaly,
                'quantity' => $scan->quantity,
                'booking' => [
                    'id' => $scan->booking?->id,
                    'booking_code' => $scan->booking?->booking_code,
                    'visit_date' => $scan->booking?->visit_date?->toDateString(),
                    'ticket_name' => $scan->item?->ticket_name ?? $scan->booking?->ticket?->name,
                ],
            ]);

        return Inertia::render('mitra/wisata/scans/index', [
            'destination' => [
                'id' => $destination->id,
                'destination_name' => $destination->destination_name,
                'address' => $destination->address_full,
            ],
            'qrImage' => QrCodeRenderer::dataUri($qrData, 340),
            'qrTemplate' => WisataEntryQrTemplate::publicPayload(),
            'qrPdfUrl' => route('mitra.wisata.scans.pdf'),
            'scans' => $scans,
            'filters' => [
                'date' => $request->string('date')->toString(),
                'search' => $request->string('search')->toString(),
                'tab' => $request->string('tab')->toString() === 'history' ? 'history' : 'qr',
            ],
        ]);
    }

    public function download(Request $request, WisataTicketUsageService $usageService): HttpResponse
    {
        $destination = MitraWisataOnboarding::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $qrData = $usageService->buildMerchantQrData($destination);
        $destinationName = $destination->destination_name ?: 'Destinasi Wisata';
        $filename = 'qr-masuk-'.Str::slug($destinationName ?: 'wisata').'.pdf';
        $template = WisataEntryQrTemplate::pdfPayload();

        $html = view('mitra-wisata-entry-qr', [
            'destinationName' => $destinationName,
            'qrImage' => QrCodeRenderer::dataUri($qrData, 520),
            'template' => $template,
        ])->render();

        $options = new Options;
        $options->set('isRemoteEnabled', false);
        $options->set('isHtml5ParserEnabled', true);

        $pdf = new Dompdf($options);
        $pdf->setPaper('A4', 'portrait');
        $pdf->loadHtml($html, 'UTF-8');
        $pdf->render();

        $disposition = $request->boolean('inline') ? 'inline' : 'attachment';

        return response($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => $disposition.'; filename="'.$filename.'"',
            'Cache-Control' => 'private, no-store, max-age=0',
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        return back()->withErrors([
            'booking_code' => 'Scan tiket oleh mitra sudah tidak digunakan. Minta user scan QR Masuk dari halaman tiket Indotix.',
        ]);
    }
}
