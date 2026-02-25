<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\UserAddress;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class UserAddressController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateAddress($request);
        $data['is_default'] = (bool) ($data['is_default'] ?? false);

        $address = $request->user()->addresses()->create($data);

        if ($data['is_default'] || $request->user()->addresses()->count() === 1) {
            $this->makeDefault($address);
        } else {
            $this->ensureDefault($request->user()->id);
        }

        return back();
    }

    public function update(Request $request, UserAddress $address): RedirectResponse
    {
        $this->authorizeAddress($request, $address);

        $data = $this->validateAddress($request);
        $data['is_default'] = (bool) ($data['is_default'] ?? false);

        $address->update($data);

        if ($data['is_default']) {
            $this->makeDefault($address);
        } else {
            $this->ensureDefault($request->user()->id);
        }

        return back();
    }

    public function destroy(Request $request, UserAddress $address): RedirectResponse
    {
        $this->authorizeAddress($request, $address);

        $userId = $address->user_id;
        $wasDefault = $address->is_default;
        $address->delete();

        if ($wasDefault) {
            $this->ensureDefault($userId);
        }

        return back();
    }

    public function setDefault(Request $request, UserAddress $address): RedirectResponse
    {
        $this->authorizeAddress($request, $address);
        $this->makeDefault($address);

        return back();
    }

    private function validateAddress(Request $request): array
    {
        return $request->validate([
            'label' => ['required', 'string', 'max:50'],
            'recipient_name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:30'],
            'address_line' => ['required', 'string', 'max:500'],
            'city' => ['nullable', 'string', 'max:100'],
            'province' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'is_default' => ['nullable', 'boolean'],
        ]);
    }

    private function authorizeAddress(Request $request, UserAddress $address): void
    {
        if ($address->user_id !== $request->user()->id) {
            abort(403);
        }
    }

    private function makeDefault(UserAddress $address): void
    {
        UserAddress::query()
            ->where('user_id', $address->user_id)
            ->where('id', '!=', $address->id)
            ->update(['is_default' => false]);

        if (! $address->is_default) {
            $address->update(['is_default' => true]);
        }
    }

    private function ensureDefault(int $userId): void
    {
        $hasDefault = UserAddress::query()
            ->where('user_id', $userId)
            ->where('is_default', true)
            ->exists();

        if ($hasDefault) {
            return;
        }

        $fallback = UserAddress::query()
            ->where('user_id', $userId)
            ->orderByDesc('updated_at')
            ->first();

        if ($fallback) {
            $fallback->update(['is_default' => true]);
        }
    }
}
