<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\WisataTicketUsageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class WisataTicketScanController extends Controller
{
    public function lookup(Request $request, WisataTicketUsageService $service): JsonResponse
    {
        $data = $request->validate([
            'qr_data' => ['required', 'string'],
        ]);

        try {
            $destination = $service->resolveDestinationFromQr($data['qr_data']);
        } catch (ValidationException $exception) {
            return response()->json([
                'message' => collect($exception->errors())->flatten()->first() ?? 'QR masuk tidak valid.',
            ], 422);
        }

        return response()->json([
            'destination' => [
                'id' => $destination->id,
                'name' => $destination->destination_name,
                'address' => $destination->address_full,
            ],
            'tickets' => $service->ticketsForUser((int) $request->user()->id, $destination),
        ]);
    }

    public function use(Request $request, WisataTicketUsageService $service): JsonResponse
    {
        $data = $request->validate([
            'qr_data' => ['required', 'string'],
            'booking_item_id' => ['required', 'integer'],
        ]);

        try {
            return response()->json([
                'result' => $service->useTicket(
                    (int) $request->user()->id,
                    $data['qr_data'],
                    (int) $data['booking_item_id']
                ),
            ]);
        } catch (ValidationException $exception) {
            return response()->json([
                'message' => collect($exception->errors())->flatten()->first() ?? 'Tiket tidak dapat digunakan.',
            ], 422);
        }
    }
}
