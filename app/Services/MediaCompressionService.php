<?php

namespace App\Services;

use Illuminate\Http\File;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class MediaCompressionService
{
    private int $thresholdBytes = 2097152;

    public function store(UploadedFile $file, string $directory, string $disk = 'public'): string
    {
        if ($file->getSize() <= $this->thresholdBytes) {
            return $file->store($directory, $disk);
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
            $compressed = $this->compressVideo($file);
            if ($compressed) {
                try {
                    return Storage::disk($disk)->putFile($directory, new File($compressed));
                } finally {
                    @unlink($compressed);
                }
            }
        }

        return $file->store($directory, $disk);
    }

    private function compressImage(UploadedFile $file): ?string
    {
        if (! extension_loaded('gd')) {
            return null;
        }

        $mime = $file->getMimeType() ?? '';
        $sourcePath = $file->getPathname();

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

    private function compressVideo(UploadedFile $file): ?string
    {
        $binary = $this->resolveFfmpegBinary();
        if (! $binary) {
            return null;
        }

        $inputPath = $file->getPathname();
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

        $path = trim((string) @shell_exec('command -v ffmpeg'));
        return $path !== '' ? $path : null;
    }
}
