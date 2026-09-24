<?php

namespace App\Http\Controllers;

use App\Models\PublicContactItem;
use Inertia\Inertia;
use Inertia\Response;

class PublicContactUsController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('public/contact-us', [
            'contacts' => PublicContactItem::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get(),
        ]);
    }
}
