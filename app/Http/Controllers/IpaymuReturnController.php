<?php

namespace App\Http\Controllers;

use Illuminate\Contracts\View\View;

class IpaymuReturnController extends Controller
{
    public function __invoke(): View
    {
        return view('payments.ipaymu-return');
    }
}
