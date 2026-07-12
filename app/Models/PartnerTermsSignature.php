<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerTermsSignature extends Model
{
    protected $fillable = [
        'partner_terms_document_id',
        'user_id',
        'business_type',
        'signer_name',
        'signed_at',
        'email_sent_at',
    ];

    protected $casts = [
        'signed_at' => 'datetime',
        'email_sent_at' => 'datetime',
    ];

    public function document(): BelongsTo
    {
        return $this->belongsTo(PartnerTermsDocument::class, 'partner_terms_document_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
