<?php

namespace App\Services;

use Illuminate\Http\File;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class MediaCompressionService
{
    private int $thresholdBytes = 2097152;

    private int $maxCompressPixels = 25000000;

    public function store(UploadedFile $file, string $directory, string $disk = 'public'): string
    {
        if ($file->getSize() <= $this->thresholdBytes) {
            return $this->storeOriginal($file, $directory, $disk);
        }

        $mime = $file->getMimeType() ?? '';

        if (str_starts_with($mime, 'image/')) {
            $compressed = $this->compressImage($file);
            if ($compressed) {
                try {
                    return Storage::disk($disk)->putFile($directory, new File($compressed));
                } finally {
                    @unlink($compressed);
                }
            }
        }

        if (str_starts_with($mime, 'video/')) {
            $compressed = $this->compressVideoPath($file->getPathname(), $file->getSize());
            if ($compressed) {
                try {
                    return Storage::disk($disk)->putFile($directory, new File($compressed));
                } finally {
                    @unlink($compressed);
                }
            }
        }

        return $this->storeOriginal($file, $directory, $disk);
    }

    public function storeOriginal(UploadedFile $file, string $directory, string $disk = 'public'): string
    {
        return $file->store($directory, $disk);
    }

    public function compressStoredVideo(string $disk, string $path, string $directory): ?string
    {
        $storage = Storage::disk($disk);
        if (! $storage->exists($path) || $storage->size($path) <= $this->thresholdBytes) {
            return null;
        }

        $sourcePath = $storage->path($path);
        $compressed = $this->compressVideoPath($sourcePath, $storage->size($path));
        if (! $compressed) {
            return null;
        }

        try {
            return $storage->putFile($directory, new File($compressed));
        } finally {
            @unlink($compressed);
        }
    }

    private function compressImage(UploadedFile $file): ?string
    {
        if (! extension_loaded('gd')) {
            return null;
        }

        $mime = $file->getMimeType() ?? '';
        $sourcePath = $file->getPathname();

        if (! $this->canSafelyCompressImage($sourcePath)) {
            return null;
        }

        switch ($mime) {
            case 'image/jpeg':
                $image = @imagecreatefromjpeg($sourcePath);
                if (! $image) {
                    return null;
                }
                $tempPath = tempnam(sys_get_temp_dir(), 'img_');
                $quality = 85;
                do {
                    imagejpeg($image, $tempPath, $quality);
                    if (filesize($tempPath) <= $this->thresholdBytes || $quality <= 60) {
                        break;
                    }
                    $quality -= 10;
                } while (true);
                imagedestroy($image);

                return $tempPath;
            case 'image/png':
                $image = @imagecreatefrompng($sourcePath);
                if (! $image) {
                    return null;
                }
                $tempPath = tempnam(sys_get_temp_dir(), 'img_');
                $compression = 6;
                do {
                    imagepng($image, $tempPath, $compression);
                    if (filesize($tempPath) <= $this->thresholdBytes || $compression >= 9) {
                        break;
                    }
                    $compression += 1;
                } while (true);
                imagedestroy($image);

                return $tempPath;
            case 'image/webp':
                if (! function_exists('imagecreatefromwebp') || ! function_exists('imagewebp')) {
                    return null;
                }
                $image = @imagecreatefromwebp($sourcePath);
                if (! $image) {
                    return null;
                }
                $tempPath = tempnam(sys_get_temp_dir(), 'img_');
                $quality = 85;
                do {
                    imagewebp($image, $tempPath, $quality);
                    if (filesize($tempPath) <= $this->thresholdBytes || $quality <= 60) {
                        break;
                    }
                    $quality -= 10;
                } while (true);
                imagedestroy($image);

                return $tempPath;
            default:
                return null;
        }
    }

    private function canSafelyCompressImage(string $sourcePath): bool
    {
        $size = @getimagesize($sourcePath);
        if (! $size) {
            return false;
        }

        $width = (int) ($size[0] ?? 0);
        $height = (int) ($size[1] ?? 0);
        if ($width <= 0 || $height <= 0) {
            return false;
        }

        $pixels = $width * $height;
        if ($pixels > $this->maxCompressPixels) {
            return false;
        }

        $memoryLimit = $this->memoryLimitBytes();
        if ($memoryLimit <= 0) {
            return true;
        }

        $estimatedBytes = $pixels * 5;

        return $estimatedBytes < ($memoryLimit * 0.4);
    }

    private function memoryLimitBytes(): int
    {
        $limit = trim((string) ini_get('memory_limit'));
        if ($limit === '' || $limit === '-1') {
            return 0;
        }

        $unit = strtolower(substr($limit, -1));
        $value = (int) $limit;

        return match ($unit) {
            'g' => $value * 1024 * 1024 * 1024,
            'm' => $value * 1024 * 1024,
            'k' => $value * 1024,
            default => $value,
        };
    }

    private function compressVideoPath(string $inputPath, ?int $originalSize = null): ?string
    {
        $binary = $this->resolveFfmpegBinary();
        if (! $binary) {
            return null;
        }

        @set_time_limit(0);

        $base = tempnam(sys_get_temp_dir(), 'vid_');
        if (! $base) {
            return null;
        }
        @unlink($base);
        $outputPath = $base.'.mp4';

        $command = sprintf(
            '%s -y -i %s -vcodec libx264 -crf 28 -preset veryfast -acodec aac -b:a 96k -movflags +faststart %s',
            escapeshellcmd($binary),
            escapeshellarg($inputPath),
            escapeshellarg($outputPath)
        );

        @exec($command, $output, $exitCode);

        if ($exitCode !== 0 || ! file_exists($outputPath)) {
            @unlink($outputPath);

            return null;
        }

        if ($originalSize !== null && filesize($outputPath) >= $originalSize) {
            @unlink($outputPath);

            return null;
        }

        return $outputPath;
    }

    private function resolveFfmpegBinary(): ?string
    {
        $candidates = [
            '/usr/bin/ffmpeg',
            '/usr/local/bin/ffmpeg',
            '/opt/homebrew/bin/ffmpeg',
        ];

        foreach ($candidates as $candidate) {
            if (is_file($candidate) && is_executable($candidate)) {
                return $candidate;
            }
        }

        $path = trim(strtok((string) @shell_exec('command -v ffmpeg'), "\r\n") ?: '');
        if ($path === '' || str_contains($path, ' ') || ! is_file($path) || ! is_executable($path)) {
            return null;
        }

        return $path;
    }
}
