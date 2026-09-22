<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\MobileHomeContent;
use Illuminate\Http\JsonResponse;

class MobileHomeController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['mobile_home' => MobileHomeContent::payload()]);
    }
}
