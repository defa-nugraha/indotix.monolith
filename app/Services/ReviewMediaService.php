<?php

namespace App\Services;

use App\Models\ProductReview;
use App\Models\ProductReviewMedia;
use Illuminate\Http\UploadedFile;

class ReviewMediaService
{
    public function __construct(private MediaCompressionService $mediaCompression)
    {
    }

    /**
     * Replace media for a review when new uploads are provided.
     *
     * @param array<int, UploadedFile> $images
     */
    public function sync(ProductReview $review, array $images = [], ?UploadedFile $video = null): void
    {
        $review->media()->get()->each->delete();

        $order = 1;
        foreach ($images as $image) {
            if (! $image instanceof UploadedFile) {
                continue;
            }
            if ($order > 5) {
                break;
            }
            $this->storeFile($review, $image, 'image', $order);
            $order++;
        }

        if ($video instanceof UploadedFile) {
            $this->storeFile($review, $video, 'video', $order);
        }
    }

    private function storeFile(ProductReview $review, UploadedFile $file, string $type, int $sortOrder): void
    {
        $directory = 'review-media/'.$review->id;
        $path = $this->mediaCompression->store($file, $directory, 'public');

        ProductReviewMedia::create([
            'product_review_id' => $review->id,
            'type' => $type,
            'path' => $path,
            'mime' => $file->getMimeType(),
            'size' => $file->getSize(),
            'sort_order' => $sortOrder,
        ]);
    }
}
