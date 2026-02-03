<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'mitra_onboarding_type',
        'is_suspended',
        'suspended_at',
        'suspended_reason',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    public function mitraOnboarding()
    {
        return $this->hasOne(\App\Models\MitraOnboarding::class);
    }

    public function mitraWisataOnboarding()
    {
        return $this->hasOne(\App\Models\MitraWisataOnboarding::class);
    }

    public function mitraEventOnboarding()
    {
        return $this->hasOne(\App\Models\MitraEventOnboarding::class);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'is_suspended' => 'boolean',
            'suspended_at' => 'datetime',
            'suspended_reason' => 'string',
        ];
    }
}
