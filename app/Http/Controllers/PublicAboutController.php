<?php

namespace App\Http\Controllers;

use App\Models\AboutPage;
use App\Models\PublicContact;
use App\Support\HtmlSanitizer;
use App\Support\HomePageContent;
use Inertia\Inertia;
use Inertia\Response;

class PublicAboutController extends Controller
{
    public function show(): Response
    {
        $about = AboutPage::query()
            ->where('is_active', true)
            ->orderByDesc('id')
            ->first();

        return Inertia::render('public/about', [
            'about' => $about ? [
                ...$about->toArray(),
                'content' => HtmlSanitizer::clean($about->content),
            ] : null,
            'homeContent' => HomePageContent::publicPayload(),
            'partners' => HomePageContent::publicPartners(),
            'contact' => PublicContact::query()->first(),
        ]);
    }
}
