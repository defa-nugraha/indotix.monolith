<?php

namespace App\Http\Controllers\Affiliate;

use App\Http\Controllers\Controller;
use App\Models\UserNotification;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(Request $request): Response
    {
        $notifications = UserNotification::query()
            ->where('user_id', $request->user()->id)
            ->where('type', 'like', 'affiliate_%')
            ->latest('id')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('affiliate/notifications', [
            'notifications' => $notifications,
        ]);
    }
}
