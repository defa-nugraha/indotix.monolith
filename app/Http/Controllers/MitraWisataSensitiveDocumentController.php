<?php

namespace App\Http\Controllers;

use App\Models\MitraWisataOnboarding;
use App\Models\User;
use App\Services\MitraWisataSensitiveDocumentService;
use App\Support\AdminDataScope;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MitraWisataSensitiveDocumentController extends Controller
{
    public function showOwn(Request $request, string $type): StreamedResponse
    {
        $destination = MitraWisataOnboarding::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        return $this->response($destination, $type);
    }

    public function showAdmin(Request $request, User $user, string $type): StreamedResponse
    {
        abort_unless($user->role === 'mitra', 404);

        $destination = MitraWisataOnboarding::query()
            ->where('user_id', $user->id)
            ->firstOrFail();

        AdminDataScope::authorizeCreatedByOrUser($destination, $request);

        return $this->response($destination, $type);
    }

    private function response(MitraWisataOnboarding $destination, string $type): StreamedResponse
    {
        $column = MitraWisataSensitiveDocumentService::TYPES[$type] ?? null;
        abort_unless($column, 404);

        $path = (string) ($destination->{$column} ?? '');
        abort_if($path === '', 404);

        $service = app(MitraWisataSensitiveDocumentService::class);
        $disk = $service->diskForPath($path);
        abort_unless(Storage::disk($disk)->exists($path), 404);

        return Storage::disk($disk)->response($path, basename($path), [
            'Cache-Control' => 'private, no-store, max-age=0',
            'Pragma' => 'no-cache',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
