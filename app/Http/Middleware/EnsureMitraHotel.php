<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureMitraHotel
{
    public function handle(Request $request, Closure $next): Response
    {
        abort(403, 'Role Mitra hanya dapat mengakses fitur operasional wisata.');
    }
}
