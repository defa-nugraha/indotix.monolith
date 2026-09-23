<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MitraWisataOnboarding;
use App\Models\WisataTicket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;

class WisataCartController extends Controller
{
    private const MAX_ITEMS = 20;

    private const MAX_QUANTITY = 20;

    private const CACHE_TTL_DAYS = 30;

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->payload($request));
    }

    public function add(Request $request): JsonResponse
    {
        $data = $request->validate([
            'destination_id' => ['required', 'string'],
            'ticket_id' => ['required', 'string'],
            'visit_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'quantity' => ['required', 'integer', 'min:1', 'max:'.self::MAX_QUANTITY],
        ]);

        $destinationId = $this->resolveId($data['destination_id']);
        $ticketId = $this->resolveId($data['ticket_id']);
        $destination = $destinationId
            ? MitraWisataOnboarding::query()->publiclyVisible()->find($destinationId)
            : null;
        $ticket = $ticketId
            ? WisataTicket::query()->whereKey($ticketId)->where('is_active', true)->where('is_closed', false)->first()
            : null;

        if (! $destination || ! $ticket || (int) $ticket->mitra_wisata_onboarding_id !== (int) $destination->id) {
            return response()->json(['message' => 'Tiket wisata tidak tersedia.'], 422);
        }

        $cart = $this->getCart($request);
        if ($cart && ($cart['destination_id'] !== (int) $destination->id || $cart['visit_date'] !== $data['visit_date'])) {
            return response()->json([
                'message' => 'Keranjang hanya dapat berisi tiket dari satu destinasi dan satu tanggal kunjungan.',
                'requires_clear' => true,
            ], 409);
        }

        $items = $cart['items'] ?? [];
        $key = (string) $ticket->id;
        $current = (int) ($items[$key]['quantity'] ?? 0);
        $quantity = $current + (int) $data['quantity'];
        if ($quantity > self::MAX_QUANTITY) {
            return response()->json(['message' => 'Maksimal 20 tiket untuk setiap jenis tiket.'], 422);
        }

        $items[$key] = ['ticket_id' => (int) $ticket->id, 'quantity' => $quantity];
        if (count($items) > self::MAX_ITEMS) {
            return response()->json(['message' => 'Jumlah jenis tiket dalam keranjang sudah maksimal.'], 422);
        }

        $this->putCart($request, [
            'destination_id' => (int) $destination->id,
            'visit_date' => $data['visit_date'],
            'items' => $items,
        ]);

        return response()->json($this->payload($request));
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ticket_id' => ['required', 'string'],
            'quantity' => ['required', 'integer', 'min:0', 'max:'.self::MAX_QUANTITY],
        ]);
        $ticketId = $this->resolveId($data['ticket_id']);
        $cart = $this->getCart($request);
        if (! $ticketId || ! $cart || ! isset($cart['items'][(string) $ticketId])) {
            return response()->json($this->payload($request));
        }

        if ((int) $data['quantity'] === 0) {
            unset($cart['items'][(string) $ticketId]);
        } else {
            $cart['items'][(string) $ticketId]['quantity'] = (int) $data['quantity'];
        }
        if (empty($cart['items'])) {
            $this->clearCart($request);
        } else {
            $this->putCart($request, $cart);
        }

        return response()->json($this->payload($request));
    }

    public function remove(Request $request): JsonResponse
    {
        return $this->update($request->merge(['quantity' => 0]));
    }

    public function clear(Request $request): JsonResponse
    {
        $this->clearCart($request);

        return response()->json($this->emptyPayload());
    }

    private function payload(Request $request): array
    {
        $cart = $this->getCart($request);
        if (! $cart) {
            return $this->emptyPayload();
        }

        $ids = collect($cart['items'] ?? [])->pluck('ticket_id')->map(fn ($id) => (int) $id)->all();
        $tickets = WisataTicket::query()->whereIn('id', $ids)->get()->keyBy('id');
        $destination = MitraWisataOnboarding::query()->find($cart['destination_id']);
        if (! $destination) {
            return $this->emptyPayload();
        }

        $items = collect($cart['items'])->map(function (array $item) use ($tickets) {
            $ticket = $tickets->get((int) $item['ticket_id']);
            if (! $ticket) {
                return null;
            }
            $quantity = max(0, (int) $item['quantity']);

            return [
                'ticket_id' => Crypt::encryptString((string) $ticket->id),
                'name' => $ticket->name,
                'quantity' => $quantity,
                'unit_price' => (int) $ticket->price,
                'subtotal' => (int) $ticket->price * $quantity,
            ];
        })->filter()->values();

        if ($items->isEmpty()) {
            return $this->emptyPayload();
        }

        return [
            'destination_id' => Crypt::encryptString((string) $destination->id),
            'destination_name' => $destination->destination_name,
            'visit_date' => $cart['visit_date'],
            'items' => $items,
            'summary' => ['subtotal' => (int) $items->sum('subtotal'), 'quantity' => (int) $items->sum('quantity')],
        ];
    }

    private function emptyPayload(): array
    {
        return ['destination_id' => null, 'destination_name' => null, 'visit_date' => null, 'items' => [], 'summary' => ['subtotal' => 0, 'quantity' => 0]];
    }

    private function resolveId(string $value): ?int
    {
        if (ctype_digit($value)) {
            return (int) $value;
        }
        try {
            return (int) Crypt::decryptString($value);
        } catch (\Throwable) {
            return null;
        }
    }

    private function getCart(Request $request): ?array
    {
        return Cache::get($this->cacheKey($request));
    }

    private function putCart(Request $request, array $cart): void
    {
        Cache::put($this->cacheKey($request), $cart, now()->addDays(self::CACHE_TTL_DAYS));
    }

    private function clearCart(Request $request): void
    {
        Cache::forget($this->cacheKey($request));
    }

    private function cacheKey(Request $request): string
    {
        return 'wisata_cart_user_'.(int) $request->user()->id;
    }
}
