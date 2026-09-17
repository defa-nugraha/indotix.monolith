<?php

namespace App\Services;

use App\Models\MitraWisataOnboarding;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class MitraWisataSensitiveDocumentService
{
    public const TYPES = [
        'ktp' => 'ktp_path',
        'selfie' => 'selfie_ktp_path',
        'legal' => 'legal_doc_path',
    ];

    public function __construct(private readonly MediaCompressionService $media) {}

    public function store(UploadedFile $file, int $userId, ?string $oldPath = null): string
    {
        $path = $this->media->store($file, "mitra-wisata-sensitive/{$userId}", 'local');

        if (! Storage::disk('local')->exists($path)) {
            throw new RuntimeException('Dokumen private gagal disimpan.');
        }

        if ($oldPath) {
            $this->deleteExisting($oldPath);
        }

        return $path;
    }

    public function diskForPath(string $path): string
    {
        return str_starts_with($path, 'mitra-wisata-sensitive/') ? 'local' : 'public';
    }

    public function migrateLegacyRecord(MitraWisataOnboarding $onboarding): int
    {
        $moved = 0;

        foreach (self::TYPES as $column) {
            $oldPath = (string) ($onboarding->{$column} ?? '');

            if ($oldPath === '' || $this->diskForPath($oldPath) === 'local') {
                continue;
            }

            $public = Storage::disk('public');
            if (! $public->exists($oldPath)) {
                continue;
            }

            $filename = basename($oldPath);
            $target = sprintf(
                'mitra-wisata-sensitive/%d/legacy-%s-%s',
                $onboarding->user_id,
                $column,
                $filename,
            );

            $stream = $public->readStream($oldPath);
            if ($stream === false) {
                throw new RuntimeException("Tidak dapat membaca dokumen legacy {$column}.");
            }

            try {
                Storage::disk('local')->writeStream($target, $stream);
            } finally {
                if (is_resource($stream)) {
                    fclose($stream);
                }
            }

            $private = Storage::disk('local');
            if (! $private->exists($target) || $private->size($target) !== $public->size($oldPath)) {
                $private->delete($target);
                throw new RuntimeException("Verifikasi migrasi dokumen {$column} gagal.");
            }

            DB::transaction(function () use ($onboarding, $column, $target) {
                MitraWisataOnboarding::query()
                    ->whereKey($onboarding->id)
                    ->lockForUpdate()
                    ->update([$column => $target]);
            }, 3);

            $public->delete($oldPath);
            $onboarding->{$column} = $target;
            $moved++;
        }

        return $moved;
    }

    private function deleteExisting(string $path): void
    {
        Storage::disk($this->diskForPath($path))->delete($path);
    }
}
