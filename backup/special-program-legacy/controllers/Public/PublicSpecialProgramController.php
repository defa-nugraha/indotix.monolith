<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventTicket;
use App\Models\Hotel;
use App\Models\MitraWisataOnboarding;
use App\Models\SpecialProgram;
use App\Models\SpecialProgramItem;
use App\Models\WisataTicket;
use App\Services\ProductReviewService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PublicSpecialProgramController extends Controller
{
    public function index(Request $request): Response
    {
        $programs = SpecialProgram::query()
            ->where('is_active', true)
            ->whereIn('status', ['active', 'scheduled'])
            ->orderByDesc('priority')
            ->get();

        $items = SpecialProgramItem::query()
            ->whereIn('special_program_id', $programs->pluck('id'))
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        $itemsByProgram = $items->groupBy('special_program_id');

        $results = $programs->map(function (SpecialProgram $program) use ($itemsByProgram) {
            $programItems = $itemsByProgram->get($program->id, collect());
            $mappedItems = $this->mapItems($programItems);

            return [
                'id' => $program->id,
                'encrypted_id' => Crypt::encryptString((string) $program->id),
                'slug' => $program->slug,
                'name' => $program->name,
                'program_type' => $program->program_type,
                'status' => $program->status,
                'starts_at' => $program->starts_at?->toDateString(),
                'ends_at' => $program->ends_at?->toDateString(),
                'highlight_level' => $program->highlight_level,
                'description_internal' => $program->description_internal,
                'items' => $mappedItems,
            ];
        });

        return Inertia::render('public/special-programs/search', [
            'programs' => $results,
        ]);
    }

    public function show(Request $request, string $program): Response|RedirectResponse
    {
        $programModel = SpecialProgram::query()
            ->where('is_active', true)
            ->whereIn('status', ['active', 'scheduled'])
            ->where('slug', $program)
            ->first();

        if (! $programModel) {
            try {
                $programId = Crypt::decryptString($program);
                $programModel = SpecialProgram::query()
                    ->where('is_active', true)
                    ->whereIn('status', ['active', 'scheduled'])
                    ->find($programId);
            } catch (\Throwable $exception) {
                $programModel = null;
            }
        }

        if (! $programModel) {
            abort(404);
        }

        if ($programModel->slug && $programModel->slug !== $program) {
            return redirect()->route('special-programs.show', ['program' => $programModel->slug]);
        }

        $program = $programModel;

        $items = SpecialProgramItem::query()
            ->where('special_program_id', $program->id)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        $mappedItems = $this->mapItems($items);

        $userId = $request->user()?->id;
        $userReview = ProductReviewService::userReview($userId, 'special_program', $program->id);
        $canReview = $userId
            ? (ProductReviewService::hasUsedBooking($userId, 'special_program', $program->id) || (bool) $userReview)
            : false;

        return Inertia::render('public/special-programs/show', [
            'program' => [
                'id' => $program->id,
                'encrypted_id' => Crypt::encryptString((string) $program->id),
                'slug' => $program->slug,
                'name' => $program->name,
                'program_type' => $program->program_type,
                'status' => $program->status,
                'starts_at' => $program->starts_at?->toDateString(),
                'ends_at' => $program->ends_at?->toDateString(),
                'highlight_level' => $program->highlight_level,
                'description_internal' => $program->description_internal,
                'terms' => $program->terms,
                'discount' => $program->discount,
                'rules' => $program->rules,
            ],
            'items' => $mappedItems,
            'reviews' => ProductReviewService::publicReviews('special_program', $program->id),
            'userReview' => $userReview,
            'canReview' => $canReview,
        ]);
    }

    private function mapItems($items): array
    {
        $items = collect($items);
        $hotelIds = $items->where('item_type', 'hotel')->pluck('item_id');
        $wisataIds = $items->where('item_type', 'wisata')->pluck('item_id');
        $eventIds = $items->where('item_type', 'event')->pluck('item_id');

        $hotels = $hotelIds->isEmpty()
            ? collect()
            : Hotel::query()
                ->whereIn('id', $hotelIds)
                ->with('images', 'city', 'roomTypes')
                ->get()
                ->keyBy('id');

        $destinations = $wisataIds->isEmpty()
            ? collect()
            : MitraWisataOnboarding::query()
                ->whereIn('id', $wisataIds)
                ->get()
                ->keyBy('id');

        $events = $eventIds->isEmpty()
            ? collect()
            : Event::query()
                ->whereIn('id', $eventIds)
                ->get()
                ->keyBy('id');

        $wisataMinPrices = $wisataIds->isEmpty()
            ? collect()
            : WisataTicket::query()
                ->whereIn('mitra_wisata_onboarding_id', $wisataIds)
                ->select('mitra_wisata_onboarding_id', DB::raw('MIN(price) as min_price'))
                ->groupBy('mitra_wisata_onboarding_id')
                ->pluck('min_price', 'mitra_wisata_onboarding_id');

        $eventMinPrices = $eventIds->isEmpty()
            ? collect()
            : EventTicket::query()
                ->whereIn('event_id', $eventIds)
                ->select('event_id', DB::raw('MIN(price) as min_price'))
                ->groupBy('event_id')
                ->pluck('min_price', 'event_id');

        $results = [];
        foreach ($items as $item) {
            if ($item->item_type === 'hotel') {
                $hotel = $hotels->get($item->item_id);
                if (! $hotel) {
                    continue;
                }
                $minPrice = $hotel->roomTypes->min('base_price');
                $results[] = [
                    'type' => 'hotel',
                    'id' => $hotel->id,
                    'encrypted_id' => Crypt::encryptString((string) $hotel->id),
                    'slug' => $hotel->slug,
                    'title' => $hotel->name,
                    'city_name' => $hotel->city?->name,
                    'description' => $hotel->description,
                    'image_url' => $hotel->images->first()?->image_url ? '/storage/'.$hotel->images->first()->image_url : null,
                    'price' => $minPrice ? (int) $minPrice : null,
                ];
                continue;
            }

            if ($item->item_type === 'wisata') {
                $destination = $destinations->get($item->item_id);
                if (! $destination) {
                    continue;
                }
                $results[] = [
                    'type' => 'wisata',
                    'id' => $destination->id,
                    'encrypted_id' => Crypt::encryptString((string) $destination->id),
                    'slug' => $destination->slug,
                    'title' => $destination->destination_name,
                    'city_name' => $this->resolveCityName($destination->city_code),
                    'description' => $destination->description,
                    'image_url' => $destination->photo_area_path ? '/storage/'.$destination->photo_area_path : null,
                    'price' => $wisataMinPrices[$destination->id] ?? null,
                ];
                continue;
            }

            if ($item->item_type === 'event') {
                $event = $events->get($item->item_id);
                if (! $event) {
                    continue;
                }
                $results[] = [
                    'type' => 'event',
                    'id' => $event->id,
                    'encrypted_id' => Crypt::encryptString((string) $event->id),
                    'slug' => $event->slug,
                    'title' => $event->title,
                    'city_name' => $this->resolveCityName($event->city_code),
                    'description' => $event->description,
                    'image_url' => null,
                    'price' => $eventMinPrices[$event->id] ?? null,
                ];
            }
        }

        return $results;
    }

    private function resolveCityName(?string $cityCode): ?string
    {
        if (! $cityCode) {
            return null;
        }

        return DB::table('regencies')->where('code', $cityCode)->value('name');
    }
}
