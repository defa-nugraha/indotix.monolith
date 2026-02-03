<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MitraEventOnboarding extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'current_step',
        'responsible_name',
        'responsible_phone',
        'responsible_role',
        'eo_name',
        'organizer_type',
        'founded_year',
        'eo_description',
        'legal_doc_type',
        'legal_doc_number',
        'legal_doc_path',
        'ktp_path',
        'selfie_ktp_path',
        'bank_name',
        'bank_account_number',
        'bank_account_name',
        'bank_account_relation',
        'operational_phone',
        'operational_email',
        'operational_hours',
        'verification_status',
        'verification_reason',
    ];

    protected $casts = [
        'founded_year' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
