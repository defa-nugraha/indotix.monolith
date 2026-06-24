<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MitraWisataOnboarding;
use App\Models\WisataReview;
use App\Support\AdminDataScope;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WisataContentController extends Controller
{
    public function index(Request $request): Response
    {
        $destinations = AdminDataScope::applyCreatedByOrUser(MitraWisataOnboarding::query(), $request)
            ->latest('id')
            ->paginate(\App\Support\PaginationOptions::perPage())
            ->withQueryString()
            ->through(fn (MitraWisataOnboarding $item) => [
                'id' => $item->id,
                'destination_name' => $item->destination_name,
                'description' => $item->description,
                'content_hidden' => $item->content_hidden,
                'content_hidden_reason' => $item->content_hidden_reason,
                'photo_gate_path' => $item->photo_gate_path,
                'photo_area_path' => $item->photo_area_path,
                'photo_ticket_path' => $item->photo_ticket_path,
                'photo_gate_hidden' => $item->photo_gate_hidden,
                'photo_area_hidden' => $item->photo_area_hidden,
                'photo_ticket_hidden' => $item->photo_ticket_hidden,
            ]);

        $reviews = WisataReview::query()
            ->with('destination')
            ->whereHas('destination', fn ($builder) => AdminDataScope::applyCreatedByOrUser($builder, $request))
            ->latest('id')
            ->paginate(\App\Support\PaginationOptions::perPage())
            ->withQueryString()
            ->through(fn (WisataReview $review) => [
                'id' => $review->id,
                'rating' => $review->rating,
                'comment' => $review->comment,
                'status' => $review->status,
                'flag_reason' => $review->flag_reason,
                'destination' => $review->destination?->destination_name,
            ]);

        return Inertia::render('admin/wisata/content/index', [
            'destinations' => $destinations,
            'reviews' => $reviews,
        ]);
    }

    public function hideContent(Request $request, MitraWisataOnboarding $destination): RedirectResponse
    {
        AdminDataScope::authorizeCreatedByOrUser($destination, $request);

        $data = $request->validate([
            'content_hidden' => ['required', 'boolean'],
            'reason' => ['nullable', 'string', 'max:500'],
            'photo_gate_hidden' => ['nullable', 'boolean'],
            'photo_area_hidden' => ['nullable', 'boolean'],
            'photo_ticket_hidden' => ['nullable', 'boolean'],
        ]);

        $destination->update([
            'content_hidden' => $data['content_hidden'],
            'content_hidden_reason' => $data['reason'] ?? null,
            'photo_gate_hidden' => $data['photo_gate_hidden'] ?? $destination->photo_gate_hidden,
            'photo_area_hidden' => $data['photo_area_hidden'] ?? $destination->photo_area_hidden,
            'photo_ticket_hidden' => $data['photo_ticket_hidden'] ?? $destination->photo_ticket_hidden,
        ]);

        return back()->with('status', 'content-updated');
    }

    public function updateReview(Request $request, WisataReview $review): RedirectResponse
    {
        if ($review->destination) {
            AdminDataScope::authorizeCreatedByOrUser($review->destination, $request);
        }

        $data = $request->validate([
            'status' => ['required', 'in:active,flagged,removed'],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $review->update([
            'status' => $data['status'],
            'flag_reason' => $data['reason'] ?? null,
        ]);

        return back()->with('status', 'review-updated');
    }
}
