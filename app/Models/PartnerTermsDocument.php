<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PartnerTermsDocument extends Model
{
    public const BUSINESS_TYPES = ['hotel', 'wisata', 'event'];

    protected $fillable = [
        'business_type',
        'title',
        'file_path',
        'uploaded_by',
    ];

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function signatures(): HasMany
    {
        return $this->hasMany(PartnerTermsSignature::class);
    }
}
