<?php

namespace App\Http\Controllers\Affiliate;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class TermsController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('affiliate/terms');
    }
}
