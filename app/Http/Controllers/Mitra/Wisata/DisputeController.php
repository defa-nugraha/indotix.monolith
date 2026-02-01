<?php

namespace App\Http\Controllers\Mitra\Wisata;

use App\Http\Controllers\Controller;
use App\Models\MitraWisataOnboarding;
use App\Models\WisataBooking;
use App\Models\WisataDispute;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class DisputeController extends Controller
{
    public function index(Request $request): Response
    {
        $destination = MitraWisataOnboarding::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $disputes = WisataDispute::query()
            ->with(['booking', 'ticket'])
            ->where('mitra_wisata_onboarding_id', $destination->id)
            ->latest('id')
            ->get()
            ->map(fn (WisataDispute $item) => [
                'id' => $item->id,
                'subject' => $item->subject,
                'status' => $item->status,
                'description' => $item->description,
                'attachment_path' => $item->attachment_path,
                'booking_code' => $item->booking?->booking_code,
                'ticket_name' => $item->ticket?->name,
            ]);

        $bookings = WisataBooking::query()
            ->where('mitra_wisata_onboarding_id', $destination->id)
            ->latest('id')
            ->take(50)
            ->get(['id', 'booking_code'])
            ->map(fn ($item) => ['id' => $item->id, 'label' => $item->booking_code]);

        return Inertia::render('mitra/wisata/disputes/index', [
            'destination' => [
                'id' => $destination->id,
                'destination_name' => $destination->destination_name,
            ],
            'disputes' => $disputes,
            'bookings' => $bookings,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $destination = MitraWisataOnboarding::query()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $data = $request->validate([
            'wisata_booking_id' => ['required', 'exists:wisata_bookings,id'],
            'subject' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:2000'],
            'attachment' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:4096'],
        ]);

        $booking = WisataBooking::query()
            ->where('mitra_wisata_onboarding_id', $destination->id)
            ->where('id', $data['wisata_booking_id'])
            ->firstOrFail();

        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')
                ->store("mitra-wisata/{$destination->id}/disputes", 'public');
        }

        WisataDispute::create([
            'wisata_booking_id' => $booking->id,
            'user_id' => $request->user()->id,
            'mitra_wisata_onboarding_id' => $destination->id,
            'wisata_ticket_id' => $booking->wisata_ticket_id,
            'subject' => $data['subject'],
            'description' => $data['description'],
            'attachment_path' => $attachmentPath,
            'status' => 'open',
        ]);

        return back()->with('status', 'dispute-created');
    }
}
