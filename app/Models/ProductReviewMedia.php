<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class ProductReviewMedia extends Model
{
    protected $fillable = [
        'product_review_id',
        'type',
        'path',
        'thumbnail_path',
        'mime',
        'size',
        'sort_order',
    ];

    protected $casts = [
        'size' => 'integer',
        'sort_order' => 'integer',
    ];

    protected static function booted(): void
    {
        static::deleting(function (self $media) {
            if ($media->path) {
                Storage::disk('public')->delete($media->path);
            }
            if ($media->thumbnail_path) {
                Storage::disk('public')->delete($media->thumbnail_path);
            }
        });
    }

    public function review(): BelongsTo
    {
        return $this->belongsTo(ProductReview::class, 'product_review_id');
    }
}
