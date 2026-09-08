<?php

namespace App\Models;

use App\Support\HtmlSanitizer;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PublicContact extends Model
{
    use HasFactory;

    protected $appends = ['address_html'];

    public function getAddressHtmlAttribute(): ?string
    {
        $address = $this->address;
        if ($address === null) {
            return null;
        }

        // Legacy textarea values need escaped text and preserved line breaks.
        if (strip_tags($address) === $address) {
            return nl2br(HtmlSanitizer::clean(str_replace('\\n', "\n", $address)) ?? '');
        }

        return HtmlSanitizer::clean($address);
    }

    protected $fillable = [
        'company_name',
        'address',
        'phone',
        'email',
        'download_url',
        'instagram_url',
        'facebook_url',
        'twitter_url',
        'tiktok_url',
        'youtube_url',
    ];
}
