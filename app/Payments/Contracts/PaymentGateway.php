<?php

namespace App\Payments\Contracts;

use App\Models\WisataBooking;
use App\Models\WisataPayment;
use App\Payments\PaymentGatewayResult;

interface PaymentGateway
{
    public function provider(): string;

    public function create(WisataBooking $booking, WisataPayment $payment): PaymentGatewayResult;

    public function status(WisataPayment $payment): ?PaymentGatewayResult;
}
