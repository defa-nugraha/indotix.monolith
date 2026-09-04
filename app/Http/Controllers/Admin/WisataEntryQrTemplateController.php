<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Support\QrCodeRenderer;
use App\Support\WisataEntryQrTemplate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WisataEntryQrTemplateController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('admin/public/entry-qr/edit', [
            'template' => WisataEntryQrTemplate::formPayload(),
            'preview' => [
                'template' => WisataEntryQrTemplate::publicPayload(),
                'qr_image' => QrCodeRenderer::dataUri('indotix-entry-qr-preview', 320),
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $textRules = collect(WisataEntryQrTemplate::textLimits())
            ->mapWithKeys(fn (int $limit, string $key) => [$key => ['required', 'string', "max:{$limit}"]])
            ->all();

        $imageRules = collect(WisataEntryQrTemplate::IMAGE_KEYS)
            ->mapWithKeys(fn (string $key) => [$key => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048']])
            ->all();

        $removeRules = collect(WisataEntryQrTemplate::IMAGE_KEYS)
            ->mapWithKeys(fn (string $key) => ["remove_{$key}" => ['nullable', 'boolean']])
            ->all();

        $data = $request->validate([
            ...$textRules,
            ...$imageRules,
            ...$removeRules,
        ]);

        WisataEntryQrTemplate::persist($data, $request->user()?->id);

        foreach (WisataEntryQrTemplate::IMAGE_KEYS as $key) {
            if ($request->boolean("remove_{$key}")) {
                WisataEntryQrTemplate::removeImage($key, $request->user()?->id);
                continue;
            }

            if ($request->hasFile($key)) {
                WisataEntryQrTemplate::storeImage($key, $request->file($key), $request->user()?->id);
            }
        }

        return back()->with('status', 'entry-qr-template-updated');
    }
}
