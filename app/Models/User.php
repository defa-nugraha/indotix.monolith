<?php

namespace App\Models;

use App\Notifications\VerifyEmailLinkNotification;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'phone',
        'gender',
        'password',
        'role',
        'admin_role_id',
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

    public function adminRole()
    {
        return $this->belongsTo(AdminRole::class);
    }

    public function mitraWisataOnboarding()
    {
        return $this->hasOne(\App\Models\MitraWisataOnboarding::class);
    }

    public function mitraEventOnboarding()
    {
        return $this->hasOne(\App\Models\MitraEventOnboarding::class);
    }

    public function addresses()
    {
        return $this->hasMany(\App\Models\UserAddress::class);
    }

    public function defaultAddress()
    {
        return $this->hasOne(\App\Models\UserAddress::class)->where('is_default', true);
    }

    public function defaultAddressString(): ?string
    {
        $address = $this->defaultAddress()->first()
            ?? $this->addresses()->orderByDesc('is_default')->first();

        return $address?->formatted_address;
    }

    public function defaultAddressValue(): ?array
    {
        $address = $this->defaultAddress()->first()
            ?? $this->addresses()->orderByDesc('is_default')->first();

        if (! $address) {
            return null;
        }

        return [
            'id' => $address->id,
            'label' => $address->label,
            'recipient_name' => $address->recipient_name,
            'phone' => $address->phone,
            'formatted' => $address->formatted_address,
            'is_default' => $address->is_default,
        ];
    }

    public function sendEmailVerificationNotification(): void
    {
        $this->notify(new VerifyEmailLinkNotification());
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
