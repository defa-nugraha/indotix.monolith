<?php

namespace App\\Http\\Controllers;

use Illuminate\\Contracts\\View\\View;
use Illuminate\\Http\\Request;

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

        return view('payments.ipaymu-return');
    }
}
