<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class BlockRetiredProductFeatures
{
    /**
     * Non-wisata product modules are retired from the active product surface.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($this->isRetiredPath(trim($request->path(), '/'))) {
            abort(404);
        }

        return $next($request);
    }

    private function isRetiredPath(string $path): bool
    {
        if ($path === '') {
            return false;
        }

        if ($path === 'mitra/onboarding/type') {
            return false;
        }

        $retiredPrefixes = [
            'stay',
            'events',
            'academy',
            'special-programs',
            'retail-shop',
            'souvenir',
            'booking',
            'tour-guide',
            'admin/special-programs',
            'admin/retail-shop',
            'admin/souvenir',
            'admin/events',
            'admin/academy',
            'admin/hotel',
            'admin/mitra',
            'admin/tour-guides',
            'hotels',
            'room-types',
            'room-inventories',
            'mitra/onboarding',
            'mitra/event',
            'mitra/events',
            'mitra/hotels',
            'mitra/room-types',
            'mitra/room-inventories',
            'mitra/bookings',
            'mitra/occupancy',
            'mitra/finance',
            'mitra/reviews',
            'api/hotel',
            'api/events',
            'api/academy',
            'api/special-programs',
            'api/souvenir',
            'api/products/hotel',
            'api/products/event',
            'api/products/academy',
            'api/products/special-programs',
            'api/products/souvenir',
        ];

        foreach ($retiredPrefixes as $prefix) {
            if ($path === $prefix || str_starts_with($path, $prefix.'/')) {
                return true;
            }
        }

        return false;
    }
}
