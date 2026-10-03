<?php

namespace App\Http\Controllers;

use App\Models\WisataPayment;
use Illuminate\Contracts\View\View;
use Illuminate\Http\Request;

class IpaymuReturnController extends Controller
{
    /**
     * iPaymu appends its transaction parameters to the signed return URL.
     * Keep the original Laravel signature validation, but ignore only those
     * provider-controlled query parameters when calculating the signature.
     */
    private const IPAYMU_APPENDED_QUERY_PARAMETERS = [
        'sid',
        'trx_id',
        'status',
        'tipe',
        'payment_method',
        'payment_channel',
    ];

    public function __invoke(Request $request): View
    {
        abort_unless(
            $request->hasValidSignatureWhileIgnoring(self::IPAYMU_APPENDED_QUERY_PARAMETERS),
            403,
        );

        $reference = trim((string) $request->query('reference', ''));
        $payment = null;

        if ($reference !== '' && strlen($reference) <= 120) {
            $payment = WisataPayment::query()
                ->where('provider', 'ipaymu')
                ->where('order_id', $reference)
                ->with('booking')
                ->latest('id')
                ->first();
        }

        $status = $this->presentationStatus($payment);

        return view('payments.ipaymu-return', [
            'status' => $status,
            'payment' => $payment,
            'reference' => $reference,
        ]);
    }

    /**
     * The browser return parameters are informational only. Never trust
     * iPaymu's query-string status to declare a payment successful.
     * The success state comes from the server-side payment lifecycle.
     */
    private function presentationStatus(?WisataPayment $payment): string
    {
        if (! $payment) {
            return 'verification';
        }

        if (
            $payment->internal_status === 'paid'
            || in_array($payment->booking?->status, ['paid', 'completed'], true)
        ) {
            return 'success';
        }

        return match ($payment->internal_status) {
            'failed' => 'failed',
            'cancelled' => 'cancelled',
            'expired' => 'expired',
            'refunded' => 'refunded',
            'pending',
            'initiating',
            'unknown',
            'cancellation_pending',
            'cancellation_unknown',
            'expiry_pending',
            'expiry_unknown' => 'verification',
            default => 'verification',
        };
    }
}
