<?php

namespace App\Support;

use Illuminate\Http\Request;

class PaginationOptions
{
    public const OPTIONS = [25, 50, 100];

    public static function perPage(?Request $request = null): int
    {
        $request ??= request();
        $perPage = (int) $request->query('per_page', 25);

        return in_array($perPage, self::OPTIONS, true) ? $perPage : 25;
    }
}
