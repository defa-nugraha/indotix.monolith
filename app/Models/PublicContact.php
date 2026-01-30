<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PublicContact extends Model
{
    use HasFactory;

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
