<?php

namespace App\Http\Controllers;

use App\Models\AcademyClass;
use App\Models\Event;
use App\Models\Hotel;
use App\Models\MitraWisataOnboarding;
use App\Models\SouvenirProduct;
use App\Models\SpecialProgram;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;

class SitemapController extends Controller
{
    public function __invoke(): Response
    {
        $xml = Cache::remember('public:sitemap:v1', now()->addHour(), function (): string {
            $urls = collect([
                ['loc' => url('/'), 'lastmod' => null],
                ['loc' => url('/stay'), 'lastmod' => null],
                ['loc' => url('/wisata'), 'lastmod' => null],
                ['loc' => url('/events'), 'lastmod' => null],
                ['loc' => url('/academy'), 'lastmod' => null],
                ['loc' => url('/special-programs'), 'lastmod' => null],
                ['loc' => url('/retail-shop'), 'lastmod' => null],
                ['loc' => url('/jelajah-indotix'), 'lastmod' => null],
            ]);

            Hotel::query()
                ->where('status', 'active')
                ->select(['id', 'slug', 'updated_at'])
                ->chunkById(200, fn ($items) => $items->each(fn (Hotel $hotel) => $urls->push([
                    'loc' => url('/stay/hotels/'.($hotel->slug ?: $hotel->id)),
                    'lastmod' => $hotel->updated_at?->toAtomString(),
                ])));

            MitraWisataOnboarding::query()
                ->where('verification_status', 'verified')
                ->where('is_live', true)
                ->where('is_suspended', false)
                ->select(['id', 'slug', 'updated_at'])
                ->chunkById(200, fn ($items) => $items->each(fn (MitraWisataOnboarding $destination) => $urls->push([
                    'loc' => url('/wisata/'.($destination->slug ?: $destination->id)),
                    'lastmod' => $destination->updated_at?->toAtomString(),
                ])));

            Event::query()
                ->where('event_type', 'event')
                ->where('status', 'published')
                ->select(['id', 'slug', 'updated_at'])
                ->chunkById(200, fn ($items) => $items->each(fn (Event $event) => $urls->push([
                    'loc' => url('/events/'.($event->slug ?: $event->id)),
                    'lastmod' => $event->updated_at?->toAtomString(),
                ])));

            AcademyClass::query()
                ->where('is_active', true)
                ->select(['id', 'slug', 'updated_at'])
                ->chunkById(200, fn ($items) => $items->each(fn (AcademyClass $class) => $urls->push([
                    'loc' => url('/academy/'.($class->slug ?: $class->id)),
                    'lastmod' => $class->updated_at?->toAtomString(),
                ])));

            SpecialProgram::query()
                ->where('is_active', true)
                ->select(['id', 'slug', 'updated_at'])
                ->chunkById(200, fn ($items) => $items->each(fn (SpecialProgram $program) => $urls->push([
                    'loc' => url('/special-programs/'.($program->slug ?: $program->id)),
                    'lastmod' => $program->updated_at?->toAtomString(),
                ])));

            SouvenirProduct::query()
                ->where('is_active', true)
                ->where('status', 'active')
                ->select(['id', 'slug', 'updated_at'])
                ->chunkById(200, fn ($items) => $items->each(fn (SouvenirProduct $product) => $urls->push([
                    'loc' => url('/retail-shop/'.($product->slug ?: $product->id)),
                    'lastmod' => $product->updated_at?->toAtomString(),
                ])));

            $body = $urls->map(function (array $url): string {
                $lastmod = $url['lastmod']
                    ? '<lastmod>'.htmlspecialchars($url['lastmod'], ENT_XML1).'</lastmod>'
                    : '';

                return '<url><loc>'.htmlspecialchars($url['loc'], ENT_XML1).'</loc>'.$lastmod.'</url>';
            })->implode('');

            return '<?xml version="1.0" encoding="UTF-8"?>'
                .'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
                .$body
                .'</urlset>';
        });

        return response($xml, 200, [
            'Content-Type' => 'application/xml; charset=UTF-8',
            'Cache-Control' => 'public, max-age=3600',
        ]);
    }
}
