<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\EmailOtp;
use App\Models\User;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        $existingUser = User::query()
            ->where('email', $input['email'] ?? null)
            ->first();

        if ($existingUser && ! $existingUser->hasVerifiedEmail()) {
            $this->clearPendingEmailVerificationOtp($existingUser);

            return $existingUser;
        }

        Validator::make($input, [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
            'role' => ['nullable', 'string', Rule::in(['user', 'mitra'])],
        ])->validate();

        $user = User::create([
            'name' => $input['name'],
            'email' => $input['email'],
            'password' => $input['password'],
            'role' => $input['role'] ?? 'user',
        ]);

        $this->clearPendingEmailVerificationOtp($user);

        return $user;
    }

    private function clearPendingEmailVerificationOtp(User $user): void
    {
        EmailOtp::query()
            ->where('user_id', $user->id)
            ->where('purpose', 'verify_email')
            ->delete();
    }
}
