<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PartnerTermsDocument;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class PartnerTermsDocumentController extends Controller
{
    public function index(): Response
    {
        $documents = PartnerTermsDocument::query()
            ->with('uploader:id,name')
            ->withCount('signatures')
            ->get()
            ->keyBy('business_type');

        return Inertia::render('admin/mitra/terms-documents', [
            'documents' => collect(PartnerTermsDocument::BUSINESS_TYPES)
                ->map(function (string $type) use ($documents) {
                    $document = $documents->get($type);

                    return [
                        'business_type' => $type,
                        'label' => $this->label($type),
                        'id' => $document?->id,
                        'title' => $document?->title,
                        'file_url' => $document?->file_path
                            ? route('admin.mitra-documents.file', $document)
                            : null,
                        'uploaded_by' => $document?->uploader?->name,
                        'updated_at' => $document?->updated_at?->toDateTimeString(),
                        'signatures_count' => $document?->signatures_count ?? 0,
                    ];
                })
                ->values(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'business_type' => ['required', Rule::in(PartnerTermsDocument::BUSINESS_TYPES)],
            'title' => ['required', 'string', 'max:255'],
            'document' => [
                Rule::requiredIf(fn () => ! PartnerTermsDocument::query()
                    ->where('business_type', $request->string('business_type')->toString())
                    ->exists()),
                File::types(['pdf'])->max(20 * 1024),
            ],
        ]);

        $existing = PartnerTermsDocument::query()
            ->where('business_type', $data['business_type'])
            ->first();

        $path = $existing?->file_path;

        if ($request->hasFile('document')) {
            $path = $request->file('document')->store('partner-terms', 'public');
        }

        if ($request->hasFile('document') && $existing?->file_path) {
            Storage::disk('public')->delete($existing->file_path);
        }

        PartnerTermsDocument::query()->updateOrCreate(
            ['business_type' => $data['business_type']],
            [
                'title' => $data['title'],
                'file_path' => $path,
                'uploaded_by' => $request->user()?->id,
            ]
        );

        return back()->with('status', 'partner-terms-updated');
    }

    public function destroy(PartnerTermsDocument $document): RedirectResponse
    {
        if ($document->file_path) {
            Storage::disk('public')->delete($document->file_path);
        }

        $document->delete();

        return back()->with('status', 'partner-terms-deleted');
    }

    public function file(PartnerTermsDocument $document): BinaryFileResponse
    {
        abort_unless($document->file_path, 404);

        $disk = Storage::disk('public');
        abort_unless($disk->exists($document->file_path), 404);

        return response()->file($disk->path($document->file_path), [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="'.basename($document->file_path).'"',
            'Cache-Control' => 'private, no-store, max-age=0',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    private function label(string $type): string
    {
        return match ($type) {
            'wisata' => 'Mitra Wisata',
            default => $type,
        };
    }
}
