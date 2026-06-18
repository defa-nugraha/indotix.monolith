<?php

namespace App\Jobs;

use App\Models\PromoVideo;
use App\Services\MediaCompressionService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class CompressPromoVideoJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public int $timeout = 900;

    public function __construct(
        public int $promoVideoId,
        public string $field,
        public string $path,
        public string $disk = 'public',
        public string $directory = 'promo-videos',
    ) {}

    public function handle(MediaCompressionService $mediaCompression): void
    {
        if (! in_array($this->field, ['image_path', 'secondary_video_path'], true)) {
            return;
        }

        $promoVideo = PromoVideo::query()->find($this->promoVideoId);
        if (! $promoVideo || $promoVideo->{$this->field} !== $this->path) {
            return;
        }

        $compressedPath = $mediaCompression->compressStoredVideo(
            $this->disk,
            $this->path,
            $this->directory,
        );

        if (! $compressedPath) {
            return;
        }

        $promoVideo->refresh();
        if ($promoVideo->{$this->field} !== $this->path) {
            Storage::disk($this->disk)->delete($compressedPath);

            return;
        }

        $promoVideo->{$this->field} = $compressedPath;
        $promoVideo->save();

        Storage::disk($this->disk)->delete($this->path);
    }
}
