<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Support\HomePageContent;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeContentController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('admin/public/home/edit', [
            'content' => HomePageContent::formPayload(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate(HomePageContent::validationRules());

        HomePageContent::persist($data, $request->user()?->id);

        return back()->with('status', 'home-content-updated');
    }
}
