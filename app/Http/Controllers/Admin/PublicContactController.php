<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PublicContact;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PublicContactController extends Controller
{
    public function edit(): Response
    {
        $contact = PublicContact::query()->firstOrCreate([]);

        return Inertia::render('admin/public/contacts/edit', [
            'contact' => $contact,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $contact = PublicContact::query()->firstOrCreate([]);

        $data = $request->validate([
            'company_name' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'phone' => ['nullable', 'string', 'max:100'],
            'email' => ['nullable', 'string', 'max:255'],
            'download_url' => ['nullable', 'string', 'max:500'],
            'instagram_url' => ['nullable', 'string', 'max:500'],
            'facebook_url' => ['nullable', 'string', 'max:500'],
            'twitter_url' => ['nullable', 'string', 'max:500'],
            'tiktok_url' => ['nullable', 'string', 'max:500'],
            'youtube_url' => ['nullable', 'string', 'max:500'],
        ]);

        $contact->update($data);

        return back()->with('status', 'contact-updated');
    }
}
