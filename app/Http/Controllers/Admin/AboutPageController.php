<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AboutPage;
use App\Support\HtmlSanitizer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AboutPageController extends Controller
{
    public function edit(): Response
    {
        $about = AboutPage::query()->firstOrCreate([], [
            'title' => 'Tentang Indotix',
            'content' => 'Konten tentang kami belum diatur.',
            'is_active' => true,
        ]);

        return Inertia::render('admin/public/about/edit', [
            'about' => $about,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $about = AboutPage::query()->firstOrCreate([], [
            'title' => 'Tentang Indotix',
            'content' => 'Konten tentang kami belum diatur.',
            'is_active' => true,
        ]);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $about->update([
            'title' => $data['title'],
            'content' => HtmlSanitizer::clean($data['content']),
            'is_active' => (bool) ($data['is_active'] ?? $about->is_active),
        ]);

        return back()->with('status', 'about-updated');
    }
}
