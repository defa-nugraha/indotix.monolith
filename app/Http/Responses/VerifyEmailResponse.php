<?php

namespace App\Http\Responses;

use App\Support\RoleRedirect;
use Illuminate\Http\JsonResponse;
use Laravel\Fortify\Contracts\VerifyEmailResponse as VerifyEmailResponseContract;

class VerifyEmailResponse implements VerifyEmailResponseContract
{
    public function toResponse($request)
    {
        if ($request->wantsJson()) {
            return new JsonResponse('', 204);
        }

        return RoleRedirect::toDashboard($request->user())
            ->with('status', 'email-verified');
    }
}
