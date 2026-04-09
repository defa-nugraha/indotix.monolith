<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PublicDeleteAccountController extends Controller
{
    public function show(Request $request): Response
    {
        return Inertia::render('public/delete-account', [
            'status' => $request->string('status')->toString(),
        ]);
    }
}
