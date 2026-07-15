<?php

namespace App\Http\Controllers;

use App\Models\BlogPost;
use App\Models\MitraWisataOnboarding;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;

class SitemapController extends Controller
{
    public function __invoke(): Response
    {
        $xml = Cache::remember('public:sitemap:v4', now()->addHour(), function (): string {
            $urls = collect([
                ['loc' => url('/'), 'lastmod' => null],
                ['loc' => url('/wisata'), 'lastmod' => null],
                ['loc' => url('/jelajah'), 'lastmod' => null],
                ['loc' => url('/about'), 'lastmod' => null],
                ['loc' => url('/faq'), 'lastmod' => null],
                ['loc' => url('/privacy-policy'), 'lastmod' => null],
                ['loc' => url('/terms-and-conditions'), 'lastmod' => null],
                ['loc' => url('/delete-account'), 'lastmod' => null],
            ]);

            MitraWisataOnboarding::query()
                ->where('verification_status', 'verified')
                ->where('is_live', true)
                ->where('is_suspended', false)
                ->select(['id', 'slug', 'updated_at'])
                ->chunkById(200, fn ($items) => $items->each(fn (MitraWisataOnboarding $destination) => $urls->push([
                    'loc' => url('/wisata/'.($destination->slug ?: $destination->id)),
                    'lastmod' => $destination->updated_at?->toAtomString(),
                ])));

            BlogPost::query()
                ->where('status', 'published')
                ->where(function ($query) {
                    $query->whereNull('published_at')
                        ->orWhere('published_at', '<=', now());
                })
                ->select(['id', 'slug', 'updated_at'])
                ->chunkById(200, fn ($items) => $items->each(fn (BlogPost $post) => $urls->push([
                    'loc' => url('/jelajah/'.$post->slug),
                    'lastmod' => $post->updated_at?->toAtomString(),
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
