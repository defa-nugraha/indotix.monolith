<?php

namespace App\Http\Controllers;

use App\Services\WisataTicketUsageService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PublicWisataTicketScanController extends Controller
{
    public function index(Request $request, WisataTicketUsageService $service): Response
    {
        $qrData = $request->string('qr')->toString();
        $payload = null;
        $error = null;

        if ($qrData !== '') {
            try {
                $destination = $service->resolveDestinationFromQr($qrData);
                $payload = [
                    'qr_data' => $qrData,
                    'destination' => [
                        'id' => $destination->id,
                        'name' => $destination->destination_name,
                        'address' => $destination->address_full,
                    ],
                    'tickets' => $service->ticketsForUser((int) $request->user()->id, $destination),
                ];
            } catch (ValidationException $exception) {
                $error = collect($exception->errors())->flatten()->first();
            } catch (\Throwable) {
                $error = 'QR masuk tidak dapat diproses.';
            }
        }

        return Inertia::render('public/tickets/scan', [
            'lookup' => $payload,
            'scanError' => $error,
        ]);
    }

    public function use(Request $request, WisataTicketUsageService $service): RedirectResponse
    {
        $data = $request->validate([
            'qr_data' => ['required', 'string'],
            'booking_item_id' => ['required', 'integer'],
        ]);

        try {
            $result = $service->useTicket(
                (int) $request->user()->id,
                $data['qr_data'],
                (int) $data['booking_item_id']
            );

            return redirect()
                ->route('tickets.scan.result', ['status' => 'success'])
                ->with('scan_result', $result);
        } catch (ValidationException $exception) {
            return redirect()
                ->route('tickets.scan.result', ['status' => 'failed'])
                ->with('scan_message', collect($exception->errors())->flatten()->first() ?? 'Tiket tidak dapat digunakan.');
        } catch (\Throwable) {
            return redirect()
                ->route('tickets.scan.result', ['status' => 'failed'])
                ->with('scan_message', 'Tiket tidak dapat digunakan saat ini.');
        }
    }

    public function result(Request $request, string $status): Response
    {
        abort_unless(in_array($status, ['success', 'failed'], true), 404);

        return Inertia::render('public/tickets/scan-result', [
            'status' => $status,
            'result' => $request->session()->get('scan_result'),
            'message' => $request->session()->get('scan_message'),
        ]);
    }
}
