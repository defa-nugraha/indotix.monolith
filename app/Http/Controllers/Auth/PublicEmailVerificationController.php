<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\View\View;

class PublicEmailVerificationController extends Controller
{
    public function __invoke(Request $request, int $id, string $hash): View
    {
        $user = User::query()->findOrFail($id);

        abort_unless(
            hash_equals(sha1($user->getEmailForVerification()), $hash),
            403,
            'Link verifikasi tidak valid.',
        );

        if (! $user->hasVerifiedEmail() && $user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        return view('auth.email-verified', [
            'loginUrl' => route('login'),
            'logoUrl' => asset('logo.png'),
        ]);
    }
}
