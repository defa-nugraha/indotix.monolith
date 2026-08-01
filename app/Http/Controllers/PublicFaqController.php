<?php

namespace App\Http\Controllers;

use App\Models\Faq;
use App\Support\HtmlSanitizer;
use Inertia\Inertia;
use Inertia\Response;

class PublicFaqController extends Controller
{
    public function index(): Response
    {
        $faqs = Faq::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(function (Faq $faq) {
                $faq->answer = HtmlSanitizer::clean($faq->answer);

                return $faq;
            });

        return Inertia::render('public/faq', [
            'faqs' => $faqs,
        ]);
    }
}
