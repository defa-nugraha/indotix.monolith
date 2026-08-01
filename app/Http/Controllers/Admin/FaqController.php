<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Faq;
use App\Support\HtmlSanitizer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FaqController extends Controller
{
    public function index(): Response
    {
        $faqs = Faq::query()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return Inertia::render('admin/public/faqs/index', [
            'faqs' => $faqs,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/public/faqs/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'question' => ['required', 'string', 'max:255'],
            'answer' => ['required', 'string'],
            'category' => ['nullable', 'string', 'max:100'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        Faq::create([
            'question' => $data['question'],
            'answer' => HtmlSanitizer::clean($data['answer']),
            'category' => $data['category'] ?? null,
            'sort_order' => $data['sort_order'] ?? 0,
            'is_active' => (bool) ($data['is_active'] ?? true),
        ]);

        return redirect('/admin/public/faqs')->with('status', 'faq-created');
    }

    public function edit(Faq $faq): Response
    {
        return Inertia::render('admin/public/faqs/edit', [
            'faq' => $faq,
        ]);
    }

    public function update(Request $request, Faq $faq): RedirectResponse
    {
        $data = $request->validate([
            'question' => ['required', 'string', 'max:255'],
            'answer' => ['required', 'string'],
            'category' => ['nullable', 'string', 'max:100'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $faq->update([
            'question' => $data['question'],
            'answer' => HtmlSanitizer::clean($data['answer']),
            'category' => $data['category'] ?? null,
            'sort_order' => $data['sort_order'] ?? 0,
            'is_active' => (bool) ($data['is_active'] ?? true),
        ]);

        return redirect('/admin/public/faqs')->with('status', 'faq-updated');
    }

    public function destroy(Faq $faq): RedirectResponse
    {
        $faq->delete();

        return redirect('/admin/public/faqs')->with('status', 'faq-deleted');
    }
}
