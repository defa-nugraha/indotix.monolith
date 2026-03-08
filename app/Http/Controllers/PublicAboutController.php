<?php

namespace App\Http\Controllers;

use App\Models\AboutPage;
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
            'about' => $about,
        ]);
    }
}
