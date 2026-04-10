<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductReview extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_type',
        'product_id',
        'user_id',
        'rating',
        'comment',
        'status',
        'reply',
        'replied_by',
        'replied_at',
        'removed_by',
        'removed_at',
    ];

    protected $casts = [
        'rating' => 'integer',
        'replied_at' => 'datetime',
        'removed_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::deleting(function (self $review) {
            $review->media()->get()->each->delete();
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function replier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'replied_by');
    }

    public function media(): HasMany
    {
        return $this->hasMany(ProductReviewMedia::class)->orderBy('sort_order');
    }
}
