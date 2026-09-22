<?php

namespace App\Http\Controllers;

use App\Models\MitraWisataOnboarding;
use App\Models\WisataTicket;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WisataCartController extends Controller
{
    public function index(Request $request)
    {
        $cart = $this->payload($request);

        return Inertia::render('public/wisata/cart', $cart);
    }

    public function add(Request $request)
    {
        $data = $request->validate([
            'destination_id' => ['required', 'integer'],
            'ticket_id' => ['nullable', 'required_without:items', 'integer'],
            'visit_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'quantity' => ['nullable', 'required_without:items', 'integer', 'min:1', 'max:20'],
            'items' => ['nullable', 'array', 'min:1', 'max:20'],
            'items.*.ticket_id' => ['required_with:items', 'integer'],
            'items.*.quantity' => ['required_with:items', 'integer', 'min:1', 'max:20'],
        ]);
        $destination = MitraWisataOnboarding::query()->publiclyVisible()->findOrFail($data['destination_id']);
        $selections = $data['items'] ?? [['ticket_id' => $data['ticket_id'], 'quantity' => $data['quantity']]];
        $ticketIds = collect($selections)->pluck('ticket_id')->all();
        $tickets = WisataTicket::query()->whereIn('id', $ticketIds)->where('is_active', true)->where('is_closed', false)->get()->keyBy('id');
        if (count($ticketIds) !== $tickets->count() || $tickets->contains(fn (WisataTicket $ticket) => (int) $ticket->mitra_wisata_onboarding_id !== (int) $destination->id)) {
            abort(422, 'Tiket tidak sesuai destinasi.');
        }

        $cart = $request->session()->get('wisata_cart');
        if ($cart && ((int) $cart['destination_id'] !== (int) $destination->id || $cart['visit_date'] !== $data['visit_date'])) {
            return back()->withErrors(['cart' => 'Keranjang hanya dapat berisi satu destinasi dan satu tanggal kunjungan.']);
        }
        $items = $cart['items'] ?? [];
        foreach ($selections as $selection) {
            $key = (string) $selection['ticket_id'];
            $items[$key] = [
                'ticket_id' => (int) $selection['ticket_id'],
                'quantity' => min(20, (int) ($items[$key]['quantity'] ?? 0) + (int) $selection['quantity']),
            ];
        }
        $request->session()->put('wisata_cart', [
            'destination_id' => $destination->id,
            'visit_date' => $data['visit_date'],
            'items' => $items,
        ]);

        return redirect()->route('wisata.cart')->with('status', 'Tiket ditambahkan ke keranjang.');
    }

    public function update(Request $request)
    {
        $data = $request->validate(['ticket_id' => ['required', 'integer'], 'quantity' => ['required', 'integer', 'min:0', 'max:20']]);
        $cart = $request->session()->get('wisata_cart', []);
        if ((int) $data['quantity'] === 0) {
            unset($cart['items'][(string) $data['ticket_id']]);
        } elseif (isset($cart['items'][(string) $data['ticket_id']])) {
            $cart['items'][(string) $data['ticket_id']]['quantity'] = (int) $data['quantity'];
        }
        if (empty($cart['items'])) {
            $request->session()->forget('wisata_cart');
        } else {
            $request->session()->put('wisata_cart', $cart);
        }

        return back();
    }

    public function remove(Request $request)
    {
        return $this->update($request->merge(['quantity' => 0]));
    }

    public function clear(Request $request)
    {
        $request->session()->forget('wisata_cart');

        return back();
    }

    private function payload(Request $request): array
    {
        $cart = $request->session()->get('wisata_cart');
        if (! $cart) {
            return ['destination' => null, 'visitDate' => null, 'items' => [], 'summary' => ['subtotal' => 0, 'quantity' => 0]];
        }
        $tickets = WisataTicket::query()->whereIn('id', collect($cart['items'] ?? [])->pluck('ticket_id'))->get()->keyBy('id');
        $destination = MitraWisataOnboarding::query()->find($cart['destination_id']);
        $items = collect($cart['items'] ?? [])->map(function (array $item) use ($tickets) {
            $ticket = $tickets->get($item['ticket_id']);
            if (! $ticket) {
                return null;
            }
            $quantity = (int) $item['quantity'];

            return ['ticket_id' => $ticket->id, 'name' => $ticket->name, 'quantity' => $quantity, 'unit_price' => (int) $ticket->price, 'subtotal' => (int) $ticket->price * $quantity];
        })->filter()->values()->all();

        return ['destination' => $destination ? ['name' => $destination->destination_name, 'id' => $destination->id] : null, 'visitDate' => $cart['visit_date'] ?? null, 'items' => $items, 'summary' => ['subtotal' => collect($items)->sum('subtotal'), 'quantity' => collect($items)->sum('quantity')]];
    }
}
