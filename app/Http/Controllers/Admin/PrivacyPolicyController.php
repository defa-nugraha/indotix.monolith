<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PrivacyPolicy;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PrivacyPolicyController extends Controller
{
    public function edit(): Response
    {
        $policy = PrivacyPolicy::query()->firstOrCreate([
            'version' => '1.0',
        ], [
            'title' => 'Kebijakan Privasi Indotix',
            'content' => 'Kebijakan privasi belum diatur.',
            'terms_content' => 'Syarat dan ketentuan belum diatur.',
            'is_active' => true,
        ]);

        return Inertia::render('admin/public/privacy-policy/edit', [
            'policy' => $policy,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $policy = PrivacyPolicy::query()->firstOrCreate([
            'version' => '1.0',
        ], [
            'title' => 'Kebijakan Privasi Indotix',
            'content' => 'Kebijakan privasi belum diatur.',
            'terms_content' => 'Syarat dan ketentuan belum diatur.',
            'is_active' => true,
        ]);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'terms_content' => ['required', 'string'],
            'version' => ['nullable', 'string', 'max:50'],
            'effective_at' => ['nullable', 'date'],
            'is_active' => ['nullable', 'boolean'],
        ], [
            'content.required' => 'Konten Kebijakan Privasi wajib diisi.',
            'terms_content.required' => 'Konten Syarat dan Ketentuan wajib diisi.',
        ]);

        $policy->update([
            'title' => $data['title'],
            'content' => $data['content'],
            'terms_content' => $data['terms_content'] ?? $policy->terms_content,
            'version' => $data['version'] ?? $policy->version,
            'effective_at' => $data['effective_at'] ?? $policy->effective_at,
            'is_active' => (bool) ($data['is_active'] ?? $policy->is_active),
        ]);

        return back()->with('status', 'privacy-policy-updated');
    }
}
