<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MitraWisataOnboarding;
use App\Models\MobileHomeHero;
use App\Models\Voucher;
use App\Rules\MobileContentUrl;
use App\Support\MobileHomeContent;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class MobileHomeContentController extends Controller
{
    public function index(): Response
    {
        $heroes = MobileHomeHero::query()->orderBy('sort_order')->orderByDesc('id')->get()->map(fn (MobileHomeHero $hero) => $this->present($hero));

        return Inertia::render('admin/mobile/home/heroes/index', ['heroes' => $heroes]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/mobile/home/heroes/create', [
            'ctaDestinations' => $this->ctaDestinations(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request, true);
        $paths = $this->storeMedia($request);
        try {
            MobileHomeHero::create([...$data, ...$paths]);
        } catch (\Throwable $exception) {
            Storage::disk('public')->delete(array_values($paths));
            throw $exception;
        }

        return to_route('admin.mobile.home.index')->with('status', 'mobile-hero-created');
    }

    public function edit(MobileHomeHero $hero): Response
    {
        return Inertia::render('admin/mobile/home/heroes/edit', [
            'hero' => $this->present($hero),
            'ctaDestinations' => $this->ctaDestinations(),
        ]);
    }

    public function update(Request $request, MobileHomeHero $hero): RedirectResponse
    {
        $data = $this->validated($request, false, $hero);
        $paths = $this->storeMedia($request);
        $oldPaths = [$hero->media_path, $hero->poster_path];
        try {
            $hero->update([...$data, ...$paths]);
        } catch (\Throwable $exception) {
            Storage::disk('public')->delete(array_values($paths));
            throw $exception;
        }
        $this->deleteReplaced($oldPaths, array_values($paths));

        return to_route('admin.mobile.home.index')->with('status', 'mobile-hero-updated');
    }

    public function destroy(MobileHomeHero $hero): RedirectResponse
    {
        $paths = [$hero->media_path, $hero->poster_path];
        $hero->delete();
        $this->deleteReplaced($paths, []);

        return back()->with('status', 'mobile-hero-deleted');
    }

    private function validated(Request $request, bool $required, ?MobileHomeHero $hero = null): array
    {
        $type = (string) $request->input('media_type', $hero?->media_type ?? 'image');
        $mediaRules = match ($type) {
            'video' => ['mimetypes:video/mp4,video/webm', 'extensions:mp4,webm', 'max:30720'],
            'gif' => ['mimetypes:image/gif', 'extensions:gif', 'max:10240'],
            default => ['image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        };
        $data = $request->validate([
            'eyebrow' => ['nullable', 'string', 'max:255'],
            'title' => ['nullable', 'string', 'max:255'],
            'highlight_title' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'cta_label' => ['nullable', 'string', 'max:255'],
            'cta_url' => ['nullable', 'string', 'max:2048', new MobileContentUrl],
            'media_type' => ['required', 'in:image,gif,video'],
            'media' => [$required ? 'required' : 'nullable', 'file', ...$mediaRules],
            'poster' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_active' => ['nullable', 'boolean'],
        ]);
        if ($type === 'video' && ! $request->hasFile('poster') && ! $hero?->poster_path) {
            throw ValidationException::withMessages(['poster' => 'Poster wajib diisi untuk Hero video.']);
        }

        return [...$data, 'media_type' => $type, 'is_active' => (bool) ($data['is_active'] ?? true), 'sort_order' => (int) ($data['sort_order'] ?? 0)];
    }

    private function storeMedia(Request $request): array
    {
        $paths = [];
        if ($request->hasFile('media')) {
            $paths['media_path'] = $request->file('media')->store('mobile/home/heroes', 'public');
        }
        if ($request->hasFile('poster')) {
            $paths['poster_path'] = $request->file('poster')->store('mobile/home/heroes', 'public');
        }

        return $paths;
    }

    private function present(MobileHomeHero $hero): array
    {
        return array_merge($hero->toArray(), ['media_url' => MobileHomeContent::url($hero->media_path), 'poster_url' => MobileHomeContent::url($hero->poster_path)]);
    }

    private function deleteReplaced(array $oldPaths, array $newPaths): void
    {
        foreach (array_filter($oldPaths) as $path) {
            if (! in_array($path, $newPaths, true) && ! MobileHomeHero::query()->where(fn ($q) => $q->where('media_path', $path)->orWhere('poster_path', $path))->exists()) {
                Storage::disk('public')->delete($path);
            }
        }
    }

    private function ctaDestinations(): array
    {
        $menuDestinations = [
            ['value' => '', 'label' => 'Tanpa tujuan (banner tetap statis)'],
            ['value' => '/home', 'label' => 'Beranda'],
            ['value' => '/wisata', 'label' => 'Jelajah Wisata'],
            ['value' => '/promo', 'label' => 'Promo & Voucher'],
            ['value' => '/history', 'label' => 'Riwayat Pesanan'],
            ['value' => '/tickets/scan', 'label' => 'Scan Tiket'],
            ['value' => '/chat', 'label' => 'Chat Bantuan'],
            ['value' => '/profile', 'label' => 'Akun / Profil'],
        ];

        $products = MitraWisataOnboarding::query()
            ->publiclyVisible()
            ->whereNotNull('slug')
            ->orderBy('destination_name')
            ->get(['id', 'destination_name', 'slug'])
            ->map(fn (MitraWisataOnboarding $destination) => [
                'value' => '/wisata/'.$destination->slug,
                'label' => $destination->destination_name,
                'meta' => 'Produk wisata',
            ])
            ->values()
            ->all();

        $vouchers = Voucher::query()
            ->where(function ($query) {
                $query->whereNull('hotel_id')->orWhere('hotel_id', 0);
            })
            ->orderBy('code')
            ->get(['id', 'code', 'is_active'])
            ->map(fn (Voucher $voucher) => [
                'value' => '/promo/voucher/'.$voucher->code,
                'label' => $voucher->code,
                'meta' => $voucher->is_active ? 'Voucher aktif' : 'Voucher nonaktif',
            ])
            ->values()
            ->all();

        return [
            ['key' => 'menu', 'label' => 'Menu Mobile', 'options' => $menuDestinations],
            ['key' => 'products', 'label' => 'Produk Wisata', 'options' => $products],
            ['key' => 'vouchers', 'label' => 'Voucher', 'options' => $vouchers],
        ];
    }
}
