<?php

namespace App\Services\Discovery;

use App\Models\AcademyClass as AcademyClassModel;
use App\Models\Event;
use App\Models\Hotel;
use App\Models\MitraWisataOnboarding;
use App\Models\SouvenirCategory;
use App\Models\SouvenirProduct;
use App\Models\SpecialProgram;
use App\Services\SearchAnalyticsService;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class DiscoveryService
{
    private const TYPES = [
        'events' => 'event',
        'hotels' => 'hotel',
        'wisata' => 'wisata',
        'academy' => 'academy',
        'special-programs' => 'special_program',
        'souvenirs' => 'souvenir',
    ];

    private const POPULAR_KEYWORDS = [
        'events' => ['konser', 'seminar', 'festival', 'event minggu ini', 'event gratis'],
        'hotels' => ['hotel murah', 'hotel dekat pantai', 'hotel bintang 4', 'family room', 'staycation'],
        'wisata' => ['wisata keluarga', 'pantai', 'museum', 'tiket promo', 'adventure'],
        'academy' => ['robotik', 'coding', 'AI', 'kelas pemula', 'kelas online'],
        'special-programs' => ['program unggulan', 'komunitas', 'sertifikat', 'program pelajar', 'program intensif'],
        'souvenirs' => ['oleh-oleh', 'merchandise', 'souvenir murah', 'produk lokal', 'ready stock'],
    ];

    public function __construct(private readonly SearchAnalyticsService $analyticsService)
    {
    }

    public function listing(string $type, Request $request): array
    {
        $type = $this->normalizeType($type);
        $filters = $this->validateListingFilters($type, $request);
        $query = $this->listingQuery($type, $filters);

        $paginator = $query->paginate(
            $filters['per_page'],
            ['*'],
            'page',
            $filters['page']
        );

        $items = $this->mapListingItems($type, $paginator->getCollection());
        $paginator->setCollection(collect($items));

        $this->analyticsService->record($request, $type, $filters, $paginator->total());

        return [
            'data' => $paginator->items(),
            'meta' => $this->paginationMeta($paginator, $type, $filters),
            'discovery' => [
                'suggestions' => $this->buildSuggestions($type, (string) ($filters['q'] ?? ''), 6),
                'popular_keywords' => $this->popularKeywords($type),
                'recommended_filters' => $this->recommendedFilters($type),
                'empty_state' => $this->emptyState($type),
            ],
        ];
    }

    public function suggestions(string $type, Request $request): array
    {
        $type = $this->normalizeType($type);
        $data = Validator::make($request->query(), [
            'q' => ['nullable', 'string', 'max:255'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:20'],
        ])->validate();

        $limit = (int) ($data['limit'] ?? 10);
        $query = trim((string) ($data['q'] ?? ''));

        return [
            'data' => $this->buildSuggestions($type, $query, $limit),
            'meta' => [
                'type' => $type,
                'q' => $query !== '' ? $query : null,
                'limit' => $limit,
            ],
        ];
    }

    public function filters(string $type, Request $request): array
    {
        $type = $this->normalizeType($type);
        $cacheKey = 'discovery:filters:'.$type;

        return [
            'data' => Cache::remember($cacheKey, now()->addMinutes(10), fn () => $this->buildFacets($type)),
            'meta' => [
                'type' => $type,
                'cache_ttl_seconds' => 600,
            ],
        ];
    }

    public function metadata(): array
    {
        return [
            'data' => collect(array_keys(self::TYPES))->map(fn (string $type) => [
                'type' => $type,
                'label' => $this->typeLabel($type),
                'listing_url' => '/api/discovery/'.$type,
                'suggestions_url' => '/api/discovery/'.$type.'/suggestions',
                'filters_url' => '/api/discovery/'.$type.'/filters',
                'sorts' => $this->sortOptions($type),
                'popular_keywords' => $this->popularKeywords($type),
            ])->values()->all(),
        ];
    }

    private function normalizeType(string $type): string
    {
        $type = trim($type);

        if (! array_key_exists($type, self::TYPES)) {
            throw new NotFoundHttpException('Discovery product type is not supported.');
        }

        return $type;
    }

    private function validateListingFilters(string $type, Request $request): array
    {
        $data = Validator::make($request->query(), [
            'q' => ['nullable', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:100'],
            'category_id' => ['nullable', 'integer', 'min:1'],
            'location' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'check_in' => ['nullable', 'date'],
            'check_out' => ['nullable', 'date', 'after:check_in'],
            'guests' => ['nullable', 'integer', 'min:1', 'max:50'],
            'rooms' => ['nullable', 'integer', 'min:1', 'max:20'],
            'min_price' => ['nullable', 'numeric', 'min:0'],
            'max_price' => ['nullable', 'numeric', 'min:0'],
            'price_type' => ['nullable', 'in:free,paid,all'],
            'status' => ['nullable', 'string', 'max:50'],
            'rating' => ['nullable', 'numeric', 'min:1', 'max:5'],
            'facilities' => ['nullable'],
            'facilities.*' => ['nullable', 'string', 'max:100'],
            'promo' => ['nullable', 'boolean'],
            'level' => ['nullable', 'string', 'max:100'],
            'mentor' => ['nullable', 'string', 'max:100'],
            'duration' => ['nullable', 'integer', 'min:1'],
            'target_participant' => ['nullable', 'string', 'max:150'],
            'quota_available' => ['nullable', 'boolean'],
            'stock_status' => ['nullable', 'in:all,in_stock,out_of_stock,low_stock'],
            'sort' => ['nullable', 'string', 'max:50'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ])->validate();

        $data['q'] = $this->cleanText($data['q'] ?? null);
        $data['category'] = $this->cleanText($data['category'] ?? null);
        $data['location'] = $this->cleanText($data['location'] ?? null);
        $data['city'] = $this->cleanText($data['city'] ?? null);
        $data['level'] = $this->cleanText($data['level'] ?? null);
        $data['mentor'] = $this->cleanText($data['mentor'] ?? null);
        $data['target_participant'] = $this->cleanText($data['target_participant'] ?? null);
        $data['facilities'] = $this->parseList($request->query('facilities'));
        $data['page'] = (int) ($data['page'] ?? 1);
        $data['per_page'] = min(50, (int) ($data['per_page'] ?? 12));
        $data['sort'] = $this->normalizeSort($type, $request->query('sort'));

        if (($data['min_price'] ?? null) !== null) {
            $data['min_price'] = (int) round((float) $data['min_price']);
        }
        if (($data['max_price'] ?? null) !== null) {
            $data['max_price'] = (int) round((float) $data['max_price']);
        }
        if (($data['min_price'] ?? null) !== null && ($data['max_price'] ?? null) !== null && $data['min_price'] > $data['max_price']) {
            [$data['min_price'], $data['max_price']] = [$data['max_price'], $data['min_price']];
        }

        $data['price_type'] = $data['price_type'] ?? 'all';
        $data['rooms'] = (int) ($data['rooms'] ?? 1);
        $data['guests'] = (int) ($data['guests'] ?? 1);
        $data['stock_status'] = $data['stock_status'] ?? 'all';

        return $data;
    }

    private function listingQuery(string $type, array $filters): Builder
    {
        $query = match ($type) {
            'events' => $this->eventQuery(),
            'hotels' => $this->hotelQuery(),
            'wisata' => $this->wisataQuery(),
            'academy' => $this->academyQuery(),
            'special-programs' => $this->specialProgramQuery(),
            'souvenirs' => $this->souvenirQuery(),
        };

        $this->applyFilters($query, $type, $filters);
        $this->applySorting($query, $type, $filters);

        return $query;
    }

    private function eventQuery(): Builder
    {
        return Event::query()
            ->where('event_type', 'event')
            ->where('status', 'published')
            ->where(function (Builder $query) {
                $query->whereNull('published_at')->orWhere('published_at', '<=', now());
            })
            ->withMin(['tickets as min_price' => fn ($query) => $query->where('is_active', true)], 'price');
    }

    private function hotelQuery(): Builder
    {
        return Hotel::query()
            ->where('status', 'active')
            ->with(['city', 'images', 'facilities', 'roomTypes' => fn ($query) => $query->where('status', 'active')])
            ->withMin(['roomTypes as min_price' => fn ($query) => $query->where('status', 'active')], 'base_price');
    }

    private function wisataQuery(): Builder
    {
        return MitraWisataOnboarding::query()
            ->where('verification_status', 'verified')
            ->where('is_suspended', false)
            ->where('is_temporarily_closed', false)
            ->with(['tickets' => fn ($query) => $query->where('is_active', true)->where('is_closed', false)])
            ->withMin(['tickets as min_price' => fn ($query) => $query->where('is_active', true)->where('is_closed', false)], 'price');
    }

    private function academyQuery(): Builder
    {
        $now = now();

        return AcademyClassModel::query()
            ->where('is_active', true)
            ->with('images')
            ->withMin(['tickets as min_price' => function ($query) use ($now) {
                $query->where('is_active', true)
                    ->where(function ($query) use ($now) {
                        $query->whereNull('sales_start_at')->orWhere('sales_start_at', '<=', $now);
                    })
                    ->where(function ($query) use ($now) {
                        $query->whereNull('sales_end_at')->orWhere('sales_end_at', '>=', $now);
                    });
            }], 'price');
    }

    private function specialProgramQuery(): Builder
    {
        return SpecialProgram::query()
            ->where('is_active', true)
            ->where(function (Builder $query) {
                $query->whereNull('status')->orWhereNotIn('status', ['draft', 'disabled', 'archived']);
            })
            ->with('variants')
            ->withMin(['variants as variant_min_price' => fn ($query) => $query->whereNotNull('price')], 'price');
    }

    private function souvenirQuery(): Builder
    {
        return SouvenirProduct::query()
            ->where('status', 'active')
            ->where('is_active', true)
            ->with(['category', 'images']);
    }

    private function applyFilters(Builder $query, string $type, array $filters): void
    {
        $term = $filters['q'] ?? null;
        if ($term) {
            $this->applySearch($query, $type, $term);
        }

        match ($type) {
            'events' => $this->applyEventFilters($query, $filters),
            'hotels' => $this->applyHotelFilters($query, $filters),
            'wisata' => $this->applyWisataFilters($query, $filters),
            'academy' => $this->applyAcademyFilters($query, $filters),
            'special-programs' => $this->applySpecialProgramFilters($query, $filters),
            'souvenirs' => $this->applySouvenirFilters($query, $filters),
        };
    }

    private function applySearch(Builder $query, string $type, string $term): void
    {
        $like = '%'.$term.'%';

        match ($type) {
            'events' => $query->where(function (Builder $query) use ($like) {
                $query->where('title', 'like', $like)
                    ->orWhere('description', 'like', $like)
                    ->orWhere('location', 'like', $like)
                    ->orWhere('address', 'like', $like);
            }),
            'hotels' => $query->where(function (Builder $query) use ($like) {
                $query->where('name', 'like', $like)
                    ->orWhere('address', 'like', $like)
                    ->orWhereHas('city', fn ($query) => $query->where('name', 'like', $like));
            }),
            'wisata' => $query->where(function (Builder $query) use ($like) {
                $query->where('destination_name', 'like', $like)
                    ->orWhere('destination_type', 'like', $like)
                    ->orWhere('address_full', 'like', $like);
            }),
            'academy' => $query->where(function (Builder $query) use ($like) {
                $query->where('title', 'like', $like)
                    ->orWhere('description', 'like', $like)
                    ->orWhere('category', 'like', $like)
                    ->orWhere('location_detail', 'like', $like);
            }),
            'special-programs' => $query->where(function (Builder $query) use ($like) {
                $query->where('name', 'like', $like)
                    ->orWhere('category', 'like', $like)
                    ->orWhere('description', 'like', $like)
                    ->orWhereHas('variants', fn ($query) => $query->where('name', 'like', $like));
            }),
            'souvenirs' => $query->where(function (Builder $query) use ($like) {
                $query->where('name', 'like', $like)
                    ->orWhere('sku', 'like', $like)
                    ->orWhere('description', 'like', $like)
                    ->orWhereHas('category', fn ($query) => $query->where('name', 'like', $like));
            }),
        };
    }

    private function applyEventFilters(Builder $query, array $filters): void
    {
        if ($category = $filters['category'] ?? null) {
            $like = '%'.$category.'%';
            $query->where(function (Builder $query) use ($like) {
                $query->where('title', 'like', $like)
                    ->orWhere('description', 'like', $like)
                    ->orWhereHas('tickets', fn ($ticketQuery) => $ticketQuery->where('name', 'like', $like));
            });
        }

        $this->applyCityOrLocationFilter($query, 'city_code', ['location', 'address'], $filters);
        $this->applyDateRange($query, 'start_at', $filters['start_date'] ?? null, $filters['end_date'] ?? null);
        $this->applyRelationPriceFilter($query, 'tickets', 'price', $filters, fn ($query) => $query->where('is_active', true));
    }

    private function applyHotelFilters(Builder $query, array $filters): void
    {
        if ($city = $filters['city'] ?? null) {
            $codes = $this->cityCodes($city);
            $query->where(function (Builder $query) use ($city, $codes) {
                if ($codes !== []) {
                    $query->whereIn('city_id', $codes);
                }
                $query->orWhere('address', 'like', '%'.$city.'%');
            });
        }

        if ($location = $filters['location'] ?? null) {
            $query->where('address', 'like', '%'.$location.'%');
        }

        if ($rating = $filters['rating'] ?? null) {
            $query->where('star_rating', '>=', (int) $rating);
        }

        if (($filters['facilities'] ?? []) !== []) {
            foreach ($filters['facilities'] as $facility) {
                $query->whereHas('facilities', fn ($facilityQuery) => $facilityQuery->where('facility_code', $facility));
            }
        }

        if (($filters['check_in'] ?? null) && ($filters['check_out'] ?? null)) {
            $dates = $this->dateRange($filters['check_in'], $filters['check_out']);
            $rooms = max(1, (int) ($filters['rooms'] ?? 1));
            if ($dates !== []) {
                $query->whereHas('roomTypes.inventories', function ($inventoryQuery) use ($dates, $rooms) {
                    $inventoryQuery->whereIn('date', $dates)
                        ->where('is_closed', false)
                        ->where('available_rooms', '>=', $rooms);
                });
            }
        }

        $this->applyRelationPriceFilter($query, 'roomTypes', 'base_price', $filters, fn ($roomQuery) => $roomQuery->where('status', 'active'));
    }

    private function applyWisataFilters(Builder $query, array $filters): void
    {
        if ($category = $filters['category'] ?? null) {
            $query->where('destination_type', 'like', '%'.$category.'%');
        }

        $this->applyCityOrLocationFilter($query, 'city_code', ['destination_name', 'address_full'], $filters);
        $this->applyRelationPriceFilter($query, 'tickets', 'price', $filters, fn ($ticketQuery) => $ticketQuery->where('is_active', true)->where('is_closed', false));
    }

    private function applyAcademyFilters(Builder $query, array $filters): void
    {
        if ($category = $filters['category'] ?? null) {
            $query->where('category', 'like', '%'.$category.'%');
        }

        if ($level = $filters['level'] ?? null) {
            $query->where(function (Builder $query) use ($level) {
                $query->where('category', 'like', '%'.$level.'%')
                    ->orWhere('description', 'like', '%'.$level.'%');
            });
        }

        if ($mentor = $filters['mentor'] ?? null) {
            $query->where('description', 'like', '%'.$mentor.'%');
        }

        if ($duration = $filters['duration'] ?? null) {
            $query->where('duration_minutes', '<=', (int) $duration);
        }

        $now = now();
        $this->applyRelationPriceFilter($query, 'tickets', 'price', $filters, function ($ticketQuery) use ($now) {
            $ticketQuery->where('is_active', true)
                ->where(function ($query) use ($now) {
                    $query->whereNull('sales_start_at')->orWhere('sales_start_at', '<=', $now);
                })
                ->where(function ($query) use ($now) {
                    $query->whereNull('sales_end_at')->orWhere('sales_end_at', '>=', $now);
                });
        });
    }

    private function applySpecialProgramFilters(Builder $query, array $filters): void
    {
        if ($category = $filters['category'] ?? null) {
            $query->where('category', $category);
        }

        if ($target = $filters['target_participant'] ?? null) {
            $like = '%'.$target.'%';
            $query->where(function (Builder $query) use ($like) {
                $query->where('description', 'like', $like)
                    ->orWhere('scope', 'like', $like)
                    ->orWhere('rules', 'like', $like);
            });
        }

        $this->applyDateRange($query, 'starts_at', $filters['start_date'] ?? null, $filters['end_date'] ?? null);

        if (($filters['quota_available'] ?? null) !== null) {
            $quotaAvailable = filter_var($filters['quota_available'], FILTER_VALIDATE_BOOLEAN);
            $quotaAvailable
                ? $query->where(function (Builder $query) {
                    $query->whereNull('capacity')->orWhere('capacity', '>', 0);
                })
                : $query->where('capacity', '<=', 0);
        }

        $this->applySpecialProgramPriceFilter($query, $filters);
    }

    private function applySouvenirFilters(Builder $query, array $filters): void
    {
        if ($categoryId = $filters['category_id'] ?? null) {
            $query->where('category_id', (int) $categoryId);
        }

        if ($category = $filters['category'] ?? null) {
            if (ctype_digit((string) $category)) {
                $query->where('category_id', (int) $category);
            } else {
                $query->whereHas('category', fn ($categoryQuery) => $categoryQuery->where('name', 'like', '%'.$category.'%'));
            }
        }

        if (($filters['min_price'] ?? null) !== null) {
            $query->where('price', '>=', $filters['min_price']);
        }
        if (($filters['max_price'] ?? null) !== null) {
            $query->where('price', '<=', $filters['max_price']);
        }

        match ($filters['stock_status'] ?? 'all') {
            'in_stock' => $query->where('stock', '>', 0),
            'out_of_stock' => $query->where('stock', '<=', 0),
            'low_stock' => $query->whereColumn('stock', '<=', 'min_stock')->where('stock', '>', 0),
            default => null,
        };
    }

    private function applyRelationPriceFilter(Builder $query, string $relation, string $column, array $filters, callable $scope): void
    {
        $hasPriceRange = ($filters['min_price'] ?? null) !== null || ($filters['max_price'] ?? null) !== null;
        $priceType = $filters['price_type'] ?? 'all';

        if (! $hasPriceRange && $priceType === 'all') {
            return;
        }

        $query->whereHas($relation, function ($relationQuery) use ($scope, $column, $filters, $priceType) {
            $scope($relationQuery);
            if (($filters['min_price'] ?? null) !== null) {
                $relationQuery->where($column, '>=', $filters['min_price']);
            }
            if (($filters['max_price'] ?? null) !== null) {
                $relationQuery->where($column, '<=', $filters['max_price']);
            }
            if ($priceType === 'free') {
                $relationQuery->where($column, '<=', 0);
            }
            if ($priceType === 'paid') {
                $relationQuery->where($column, '>', 0);
            }
        });
    }

    private function applySpecialProgramPriceFilter(Builder $query, array $filters): void
    {
        $hasPriceRange = ($filters['min_price'] ?? null) !== null || ($filters['max_price'] ?? null) !== null;
        $priceType = $filters['price_type'] ?? 'all';

        if (! $hasPriceRange && $priceType === 'all') {
            return;
        }

        $query->where(function (Builder $query) use ($filters, $priceType) {
            $query->where(function (Builder $baseQuery) use ($filters, $priceType) {
                if (($filters['min_price'] ?? null) !== null) {
                    $baseQuery->where('base_price', '>=', $filters['min_price']);
                }
                if (($filters['max_price'] ?? null) !== null) {
                    $baseQuery->where('base_price', '<=', $filters['max_price']);
                }
                if ($priceType === 'free') {
                    $baseQuery->where('base_price', '<=', 0);
                }
                if ($priceType === 'paid') {
                    $baseQuery->where('base_price', '>', 0);
                }
            })->orWhereHas('variants', function ($variantQuery) use ($filters, $priceType) {
                if (($filters['min_price'] ?? null) !== null) {
                    $variantQuery->where('price', '>=', $filters['min_price']);
                }
                if (($filters['max_price'] ?? null) !== null) {
                    $variantQuery->where('price', '<=', $filters['max_price']);
                }
                if ($priceType === 'free') {
                    $variantQuery->where('price', '<=', 0);
                }
                if ($priceType === 'paid') {
                    $variantQuery->where('price', '>', 0);
                }
            });
        });
    }

    private function applyCityOrLocationFilter(Builder $query, string $cityColumn, array $locationColumns, array $filters): void
    {
        $city = $filters['city'] ?? null;
        $location = $filters['location'] ?? null;
        $term = $city ?: $location;

        if (! $term) {
            return;
        }

        $codes = $this->cityCodes($term);
        $query->where(function (Builder $query) use ($codes, $term, $cityColumn, $locationColumns) {
            if ($codes !== []) {
                $query->whereIn($cityColumn, $codes);
            }

            foreach ($locationColumns as $column) {
                $query->orWhere($column, 'like', '%'.$term.'%');
            }
        });
    }

    private function applyDateRange(Builder $query, string $column, ?string $startDate, ?string $endDate): void
    {
        if ($startDate) {
            $query->whereDate($column, '>=', $startDate);
        }
        if ($endDate) {
            $query->whereDate($column, '<=', $endDate);
        }
    }

    private function applySorting(Builder $query, string $type, array $filters): void
    {
        $sort = $filters['sort'] ?? 'relevant';
        $term = $filters['q'] ?? null;

        if ($sort === 'relevant' && $term) {
            $column = match ($type) {
                'events' => 'title',
                'hotels' => 'name',
                'wisata' => 'destination_name',
                'academy' => 'title',
                'special-programs' => 'name',
                'souvenirs' => 'name',
            };
            $query->orderByRaw('CASE WHEN '.$column.' LIKE ? THEN 0 ELSE 1 END', [$term.'%']);
        }

        match ($type) {
            'events' => $this->sortEvents($query, $sort),
            'hotels' => $this->sortHotels($query, $sort),
            'wisata' => $this->sortWisata($query, $sort),
            'academy' => $this->sortAcademy($query, $sort),
            'special-programs' => $this->sortSpecialPrograms($query, $sort),
            'souvenirs' => $this->sortSouvenirs($query, $sort),
        };
    }

    private function sortEvents(Builder $query, string $sort): void
    {
        match ($sort) {
            'popular' => $query->orderByDesc('capacity_sold')->orderBy('start_at'),
            'newest' => $query->orderByDesc('published_at')->orderByDesc('created_at'),
            'upcoming' => $query->orderByRaw('start_at IS NULL')->orderBy('start_at'),
            'price_low' => $query->orderByRaw('min_price IS NULL')->orderBy('min_price'),
            'price_high' => $query->orderByDesc('min_price'),
            'title' => $query->orderBy('title'),
            default => $query->orderByDesc('capacity_sold')->orderByRaw('start_at IS NULL')->orderBy('start_at'),
        };
    }

    private function sortHotels(Builder $query, string $sort): void
    {
        match ($sort) {
            'popular', 'rating_high' => $query->orderByDesc('star_rating')->orderBy('name'),
            'newest' => $query->orderByDesc('created_at'),
            'price_low' => $query->orderByRaw('min_price IS NULL')->orderBy('min_price'),
            'price_high' => $query->orderByDesc('min_price'),
            'title' => $query->orderBy('name'),
            default => $query->orderByDesc('star_rating')->orderBy('name'),
        };
    }

    private function sortWisata(Builder $query, string $sort): void
    {
        match ($sort) {
            'popular', 'newest' => $query->orderByDesc('created_at'),
            'price_low' => $query->orderByRaw('min_price IS NULL')->orderBy('min_price'),
            'price_high' => $query->orderByDesc('min_price'),
            'title' => $query->orderBy('destination_name'),
            default => $query->orderBy('destination_name'),
        };
    }

    private function sortAcademy(Builder $query, string $sort): void
    {
        match ($sort) {
            'popular' => $query->orderByDesc('capacity_sold')->orderBy('start_at'),
            'newest' => $query->orderByDesc('created_at'),
            'upcoming' => $query->orderByRaw('start_at IS NULL')->orderBy('start_at'),
            'price_low' => $query->orderByRaw('min_price IS NULL')->orderBy('min_price'),
            'price_high' => $query->orderByDesc('min_price'),
            'title' => $query->orderBy('title'),
            default => $query->orderByRaw('start_at IS NULL')->orderBy('start_at'),
        };
    }

    private function sortSpecialPrograms(Builder $query, string $sort): void
    {
        match ($sort) {
            'popular' => $query->orderByDesc('priority')->orderByDesc('created_at'),
            'newest' => $query->orderByDesc('created_at'),
            'upcoming' => $query->orderByRaw('starts_at IS NULL')->orderBy('starts_at'),
            'price_low' => $query->orderByRaw('COALESCE(variant_min_price, base_price) ASC'),
            'price_high' => $query->orderByRaw('COALESCE(variant_min_price, base_price) DESC'),
            'title' => $query->orderBy('name'),
            default => $query->orderByDesc('priority')->orderByDesc('created_at'),
        };
    }

    private function sortSouvenirs(Builder $query, string $sort): void
    {
        match ($sort) {
            'popular', 'stock_high' => $query->orderByDesc('stock')->orderBy('name'),
            'newest' => $query->orderByDesc('created_at'),
            'price_low' => $query->orderBy('price'),
            'price_high' => $query->orderByDesc('price'),
            'title' => $query->orderBy('name'),
            default => $query->orderByDesc('stock')->orderByDesc('created_at'),
        };
    }

    private function mapListingItems(string $type, Collection $items): array
    {
        return match ($type) {
            'events' => $this->mapEvents($items),
            'hotels' => $items->map(fn (Hotel $hotel) => $this->mapHotel($hotel))->all(),
            'wisata' => $this->mapWisata($items),
            'academy' => $items->map(fn (AcademyClassModel $class) => $this->mapAcademy($class))->all(),
            'special-programs' => $items->map(fn (SpecialProgram $program) => $this->mapSpecialProgram($program))->all(),
            'souvenirs' => $items->map(fn (SouvenirProduct $product) => $this->mapSouvenir($product))->all(),
        };
    }

    private function mapEvents(Collection $events): array
    {
        $cityMap = $this->cityNameMap($events->pluck('city_code')->filter()->unique()->values());

        return $events->map(function (Event $event) use ($cityMap) {
            $cityName = $cityMap[$event->city_code] ?? null;
            $price = $event->min_price !== null ? (int) $event->min_price : null;
            $capacity = max(0, (int) $event->capacity_total - (int) $event->capacity_sold);
            $encryptedId = $this->encryptedId($event->id);

            return [
                'id' => $encryptedId,
                'encrypted_id' => $encryptedId,
                'type' => 'event',
                'title' => $event->title,
                'slug' => $event->slug,
                'image' => $this->eventImage($event),
                'image_url' => $this->eventImage($event),
                'price' => $price,
                'price_label' => $this->priceLabel($price),
                'badge' => $this->priceBadge($price, 'Event'),
                'tags' => array_values(array_filter([$cityName, $event->location, $event->start_at?->format('d M Y')])),
                'metadata' => [
                    'location' => $event->location,
                    'city' => $cityName,
                    'date' => $event->start_at?->toDateString(),
                    'rating' => null,
                    'duration' => null,
                    'category' => null,
                ],
                'availability' => [
                    'status' => $capacity > 0 || (int) $event->capacity_total === 0 ? 'available' : 'sold_out',
                    'quota' => $capacity > 0 ? $capacity : null,
                ],
                'cta' => [
                    'label' => 'Lihat Detail',
                    'url' => '/events/'.$event->slug,
                ],
            ];
        })->values()->all();
    }

    private function mapHotel(Hotel $hotel): array
    {
        $price = $hotel->min_price !== null ? (int) round((float) $hotel->min_price) : null;
        $image = $hotel->images->first()?->image_url;
        $availableRooms = (int) $hotel->roomTypes->sum('total_rooms');
        $encryptedId = $this->encryptedId($hotel->id);

        return [
            'id' => $encryptedId,
            'encrypted_id' => $encryptedId,
            'type' => 'hotel',
            'title' => $hotel->name,
            'name' => $hotel->name,
            'slug' => $hotel->slug,
            'image' => $this->storageUrl($image) ?? '/images/placeholder-card.jpg',
            'image_url' => $this->storageUrl($image) ?? '/images/placeholder-card.jpg',
            'price' => $price,
            'price_label' => $this->priceLabel($price),
            'badge' => $hotel->star_rating ? $hotel->star_rating.'★' : 'Hotel',
            'tags' => array_values(array_filter([$hotel->city?->name, $hotel->star_rating ? $hotel->star_rating.' bintang' : null, $price ? 'Per malam' : null])),
            'metadata' => [
                'location' => $hotel->address,
                'city' => $hotel->city?->name,
                'date' => null,
                'rating' => $hotel->star_rating,
                'duration' => null,
                'category' => 'Hotel',
                'facilities' => $hotel->facilities->pluck('facility_code')->values()->all(),
            ],
            'availability' => [
                'status' => $availableRooms > 0 ? 'available' : 'limited',
                'quota' => $availableRooms > 0 ? $availableRooms : null,
            ],
            'cta' => [
                'label' => 'Lihat Kamar',
                'url' => '/stay/hotels/'.$hotel->slug,
            ],
        ];
    }

    private function mapWisata(Collection $destinations): array
    {
        $cityMap = $this->cityNameMap($destinations->pluck('city_code')->filter()->unique()->values());

        return $destinations->map(function (MitraWisataOnboarding $destination) use ($cityMap) {
            $price = $destination->min_price !== null ? (int) $destination->min_price : null;
            $cityName = $cityMap[$destination->city_code] ?? null;
            $quota = $destination->tickets->sum(fn ($ticket) => (int) ($ticket->daily_quota ?? $ticket->quota));
            $encryptedId = $this->encryptedId($destination->id);

            return [
                'id' => $encryptedId,
                'encrypted_id' => $encryptedId,
                'type' => 'wisata',
                'title' => $destination->destination_name,
                'destination_name' => $destination->destination_name,
                'slug' => $destination->slug,
                'image' => $this->wisataImage($destination),
                'image_url' => $this->wisataImage($destination),
                'price' => $price,
                'price_label' => $this->priceLabel($price),
                'badge' => $destination->destination_type ? ucfirst($destination->destination_type) : 'Wisata',
                'tags' => array_values(array_filter([$cityName, $destination->destination_type ? ucfirst($destination->destination_type) : null, $price ? 'Tiket tersedia' : null])),
                'metadata' => [
                    'location' => $destination->address_full,
                    'city' => $cityName,
                    'date' => null,
                    'rating' => null,
                    'duration' => null,
                    'category' => $destination->destination_type,
                ],
                'availability' => [
                    'status' => $quota > 0 ? 'available' : 'limited',
                    'quota' => $quota > 0 ? $quota : null,
                ],
                'cta' => [
                    'label' => 'Lihat Tiket',
                    'url' => '/wisata/'.$destination->slug,
                ],
            ];
        })->values()->all();
    }

    private function mapAcademy(AcademyClassModel $class): array
    {
        $price = $class->min_price !== null ? (int) $class->min_price : null;
        $quota = max(0, (int) $class->capacity_total - (int) $class->capacity_sold);
        $encryptedId = $this->encryptedId($class->id);
        $image = $class->images->first()?->image_path;

        return [
            'id' => $encryptedId,
            'encrypted_id' => $encryptedId,
            'type' => 'academy',
            'title' => $class->title,
            'slug' => $class->slug,
            'image' => $this->storageUrl($image),
            'image_url' => $this->storageUrl($image),
            'price' => $price,
            'price_label' => $this->priceLabel($price),
            'badge' => $class->category ?: 'Academy',
            'tags' => array_values(array_filter([$class->category, $class->start_at?->format('d M Y'), $class->location_detail, $this->priceBadge($price, 'Kelas')])),
            'metadata' => [
                'location' => $class->location_detail,
                'date' => $class->start_at?->toDateString(),
                'rating' => null,
                'duration' => $class->duration_minutes,
                'category' => $class->category,
                'level' => null,
                'mentor' => null,
            ],
            'availability' => [
                'status' => $quota > 0 || (int) $class->capacity_total === 0 ? 'available' : 'sold_out',
                'quota' => $quota > 0 ? $quota : null,
            ],
            'cta' => [
                'label' => 'Lihat Kelas',
                'url' => '/academy/'.$class->slug,
            ],
        ];
    }

    private function mapSpecialProgram(SpecialProgram $program): array
    {
        $variantPrice = $program->variant_min_price !== null ? (int) $program->variant_min_price : null;
        $price = $variantPrice ?? ((int) $program->base_price > 0 ? (int) $program->base_price : null);
        $encryptedId = $this->encryptedId($program->id);

        return [
            'id' => $encryptedId,
            'encrypted_id' => $encryptedId,
            'type' => 'special_program',
            'title' => $program->name,
            'name' => $program->name,
            'slug' => $program->slug,
            'image' => $this->storageUrl($program->image_path),
            'image_url' => $this->storageUrl($program->image_path),
            'price' => $price,
            'price_label' => $this->priceLabel($price),
            'badge' => $program->category ? ucfirst($program->category) : 'Program',
            'tags' => array_values(array_filter([$program->category ? ucfirst($program->category) : null, $program->starts_at?->format('d M Y'), $program->capacity ? 'Kuota '.$program->capacity : null])),
            'metadata' => [
                'location' => null,
                'date' => $program->starts_at?->toDateString(),
                'end_date' => $program->ends_at?->toDateString(),
                'rating' => null,
                'duration' => null,
                'category' => $program->category,
                'target_participant' => null,
            ],
            'availability' => [
                'status' => $program->capacity === null || (int) $program->capacity > 0 ? 'available' : 'limited',
                'quota' => $program->capacity,
            ],
            'cta' => [
                'label' => 'Lihat Program',
                'url' => '/special-programs/'.$program->slug,
            ],
        ];
    }

    private function mapSouvenir(SouvenirProduct $product): array
    {
        $price = (int) $product->price;
        $encryptedId = $this->encryptedId($product->id);
        $image = $product->images->first()?->image_url;

        return [
            'id' => $encryptedId,
            'encrypted_id' => $encryptedId,
            'type' => 'souvenir',
            'title' => $product->name,
            'name' => $product->name,
            'slug' => $product->slug,
            'image' => $this->storageUrl($image),
            'image_url' => $this->storageUrl($image),
            'price' => $price,
            'price_label' => $this->priceLabel($price),
            'badge' => $product->category?->name ?: 'Retail',
            'tags' => array_values(array_filter([$product->category?->name, $product->stock > 0 ? 'Stok tersedia' : 'Stok habis', $product->sku])),
            'metadata' => [
                'location' => null,
                'date' => null,
                'rating' => null,
                'duration' => null,
                'category' => $product->category?->name,
                'sku' => $product->sku,
            ],
            'availability' => [
                'status' => $product->stock > 0 ? 'available' : 'sold_out',
                'quota' => (int) $product->stock,
            ],
            'cta' => [
                'label' => 'Lihat Produk',
                'url' => '/retail-shop/'.$product->slug,
            ],
        ];
    }

    private function buildSuggestions(string $type, string $query, int $limit): array
    {
        $query = trim($query);
        $suggestions = collect();

        foreach ($this->popularKeywords($type, $query) as $keyword) {
            $suggestions->push([
                'type' => 'keyword',
                'label' => $keyword,
                'value' => $keyword,
            ]);
        }

        foreach ($this->productSuggestions($type, $query, $limit) as $item) {
            $suggestions->push($item);
        }

        foreach ($this->facetSuggestions($type, $query, $limit) as $item) {
            $suggestions->push($item);
        }

        return $suggestions
            ->unique(fn ($item) => $item['type'].'|'.strtolower((string) $item['label']))
            ->take($limit)
            ->values()
            ->all();
    }

    private function productSuggestions(string $type, string $query, int $limit): array
    {
        $limit = max(3, min(8, $limit));
        $like = $query !== '' ? '%'.$query.'%' : null;

        return match ($type) {
            'events' => $this->eventQuery()
                ->when($like, fn ($q) => $q->where('title', 'like', $like))
                ->orderByDesc('capacity_sold')
                ->limit($limit)
                ->get()
                ->map(fn (Event $event) => $this->productSuggestion('product', $event->title, $event->slug, $this->eventImage($event), $event->min_price !== null ? (int) $event->min_price : null))
                ->all(),
            'hotels' => $this->hotelQuery()
                ->when($like, fn ($q) => $q->where('name', 'like', $like))
                ->orderByDesc('star_rating')
                ->limit($limit)
                ->get()
                ->map(fn (Hotel $hotel) => $this->productSuggestion('product', $hotel->name, $hotel->slug, $this->storageUrl($hotel->images->first()?->image_url), $hotel->min_price !== null ? (int) $hotel->min_price : null))
                ->all(),
            'wisata' => $this->wisataQuery()
                ->when($like, fn ($q) => $q->where('destination_name', 'like', $like))
                ->orderBy('destination_name')
                ->limit($limit)
                ->get()
                ->map(fn (MitraWisataOnboarding $destination) => $this->productSuggestion('product', $destination->destination_name, $destination->slug, $this->wisataImage($destination), $destination->min_price !== null ? (int) $destination->min_price : null))
                ->all(),
            'academy' => $this->academyQuery()
                ->when($like, fn ($q) => $q->where('title', 'like', $like))
                ->orderBy('start_at')
                ->limit($limit)
                ->get()
                ->map(fn (AcademyClassModel $class) => $this->productSuggestion('product', $class->title, $class->slug, $this->storageUrl($class->images->first()?->image_path), $class->min_price !== null ? (int) $class->min_price : null))
                ->all(),
            'special-programs' => $this->specialProgramQuery()
                ->when($like, fn ($q) => $q->where('name', 'like', $like))
                ->orderByDesc('priority')
                ->limit($limit)
                ->get()
                ->map(fn (SpecialProgram $program) => $this->productSuggestion('product', $program->name, $program->slug, $this->storageUrl($program->image_path), $program->variant_min_price !== null ? (int) $program->variant_min_price : ((int) $program->base_price ?: null)))
                ->all(),
            'souvenirs' => $this->souvenirQuery()
                ->when($like, function ($q) use ($like) {
                    $q->where(function (Builder $query) use ($like) {
                        $query->where('name', 'like', $like)->orWhere('sku', 'like', $like);
                    });
                })
                ->orderByDesc('stock')
                ->limit($limit)
                ->get()
                ->map(fn (SouvenirProduct $product) => $this->productSuggestion('product', $product->name, $product->slug, $this->storageUrl($product->images->first()?->image_url), (int) $product->price))
                ->all(),
        };
    }

    private function productSuggestion(string $type, string $label, ?string $slug, ?string $image, ?int $price): array
    {
        return [
            'type' => $type,
            'label' => $label,
            'value' => $slug ?: $label,
            'metadata' => [
                'image' => $image,
                'price_label' => $this->priceLabel($price),
                'query' => $label,
            ],
        ];
    }

    private function facetSuggestions(string $type, string $query, int $limit): array
    {
        $facets = $this->buildFacets($type);
        $items = collect();
        $lowerQuery = strtolower($query);

        foreach (['categories' => 'category', 'locations' => 'location', 'cities' => 'location', 'facilities' => 'facility', 'mentors' => 'mentor'] as $key => $suggestionType) {
            foreach (($facets[$key] ?? []) as $facet) {
                $label = (string) ($facet['label'] ?? '');
                if ($label === '') {
                    continue;
                }
                if ($lowerQuery !== '' && ! str_contains(strtolower($label), $lowerQuery)) {
                    continue;
                }
                $items->push([
                    'type' => $suggestionType,
                    'label' => $label,
                    'value' => $facet['value'] ?? $label,
                    'metadata' => ['count' => $facet['count'] ?? null],
                ]);
            }
        }

        return $items->take($limit)->values()->all();
    }

    private function buildFacets(string $type): array
    {
        return match ($type) {
            'events' => $this->eventFacets(),
            'hotels' => $this->hotelFacets(),
            'wisata' => $this->wisataFacets(),
            'academy' => $this->academyFacets(),
            'special-programs' => $this->specialProgramFacets(),
            'souvenirs' => $this->souvenirFacets(),
        };
    }

    private function eventFacets(): array
    {
        $base = $this->eventQuery();
        $cityCounts = $this->cityFacets($base, 'city_code');
        $range = $this->priceRange('event_tickets', 'price', function ($query) {
            $query->join('events', 'events.id', '=', 'event_tickets.event_id')
                ->where('event_tickets.is_active', true)
                ->where('events.event_type', 'event')
                ->where('events.status', 'published');
        });
        $dateRange = DB::table('events')
            ->where('event_type', 'event')
            ->where('status', 'published')
            ->where(function ($query) {
                $query->whereNull('published_at')->orWhere('published_at', '<=', now());
            })
            ->selectRaw('MIN(start_at) as min_date, MAX(start_at) as max_date')
            ->first();

        return [
            'categories' => [],
            'locations' => $cityCounts,
            'cities' => $cityCounts,
            'date_range' => [
                'min' => $dateRange?->min_date ? Carbon::parse($dateRange->min_date)->toDateString() : null,
                'max' => $dateRange?->max_date ? Carbon::parse($dateRange->max_date)->toDateString() : null,
            ],
            'price_range' => $range,
            'price_types' => $this->priceTypeOptions(),
            'sorts' => $this->sortOptions('events'),
        ];
    }

    private function hotelFacets(): array
    {
        $base = $this->hotelQuery();
        $cityCounts = $this->cityFacets($base, 'city_id');
        $range = $this->priceRange('room_types', 'base_price', function ($query) {
            $query->join('hotels', 'hotels.id', '=', 'room_types.hotel_id')
                ->where('room_types.status', 'active')
                ->where('hotels.status', 'active');
        });

        return [
            'cities' => $cityCounts,
            'locations' => $cityCounts,
            'price_range' => $range,
            'rating_options' => (clone $base)
                ->select('star_rating', DB::raw('COUNT(*) as count'))
                ->whereNotNull('star_rating')
                ->groupBy('star_rating')
                ->orderByDesc('star_rating')
                ->get()
                ->map(fn ($row) => ['label' => $row->star_rating.' bintang', 'value' => (string) $row->star_rating, 'count' => (int) $row->count])
                ->values()
                ->all(),
            'facilities' => DB::table('hotel_facilities')
                ->join('hotels', 'hotels.id', '=', 'hotel_facilities.hotel_id')
                ->where('hotels.status', 'active')
                ->select('hotel_facilities.facility_code', DB::raw('COUNT(*) as count'))
                ->groupBy('hotel_facilities.facility_code')
                ->orderBy('hotel_facilities.facility_code')
                ->get()
                ->map(fn ($row) => ['label' => $this->facilityLabel($row->facility_code), 'value' => $row->facility_code, 'count' => (int) $row->count])
                ->values()
                ->all(),
            'sorts' => $this->sortOptions('hotels'),
        ];
    }

    private function wisataFacets(): array
    {
        $base = $this->wisataQuery();
        $cityCounts = $this->cityFacets($base, 'city_code');
        $range = $this->priceRange('wisata_tickets', 'price', function ($query) {
            $query->join('mitra_wisata_onboardings', 'mitra_wisata_onboardings.id', '=', 'wisata_tickets.mitra_wisata_onboarding_id')
                ->where('wisata_tickets.is_active', true)
                ->where('wisata_tickets.is_closed', false)
                ->where('mitra_wisata_onboardings.verification_status', 'verified')
                ->where('mitra_wisata_onboardings.is_suspended', false)
                ->where('mitra_wisata_onboardings.is_temporarily_closed', false);
        });

        return [
            'categories' => $this->simpleFacet($base, 'destination_type'),
            'locations' => $cityCounts,
            'cities' => $cityCounts,
            'price_range' => $range,
            'promo_options' => [],
            'sorts' => $this->sortOptions('wisata'),
        ];
    }

    private function academyFacets(): array
    {
        $base = $this->academyQuery();
        $range = $this->priceRange('academy_tickets', 'price', function ($query) {
            $now = now();
            $query->join('academy_classes', 'academy_classes.id', '=', 'academy_tickets.academy_class_id')
                ->where('academy_classes.is_active', true)
                ->where('academy_tickets.is_active', true)
                ->where(function ($query) use ($now) {
                    $query->whereNull('academy_tickets.sales_start_at')->orWhere('academy_tickets.sales_start_at', '<=', $now);
                })
                ->where(function ($query) use ($now) {
                    $query->whereNull('academy_tickets.sales_end_at')->orWhere('academy_tickets.sales_end_at', '>=', $now);
                });
        });

        return [
            'categories' => $this->simpleFacet($base, 'category'),
            'levels' => [],
            'mentors' => [],
            'price_types' => $this->priceTypeOptions(),
            'price_range' => $range,
            'duration_range' => $this->academyDurationRange(),
            'sorts' => $this->sortOptions('academy'),
        ];
    }

    private function specialProgramFacets(): array
    {
        $base = $this->specialProgramQuery();
        $variantRange = $this->priceRange('special_program_variants', 'price', function ($query) {
            $query->join('special_programs', 'special_programs.id', '=', 'special_program_variants.special_program_id')
                ->where('special_programs.is_active', true)
                ->where(function ($query) {
                    $query->whereNull('special_programs.status')->orWhereNotIn('special_programs.status', ['draft', 'disabled', 'archived']);
                });
        });
        $baseRange = DB::table('special_programs')
            ->where('is_active', true)
            ->where(function ($query) {
                $query->whereNull('status')->orWhereNotIn('status', ['draft', 'disabled', 'archived']);
            })
            ->selectRaw('MIN(base_price) as min, MAX(base_price) as max')
            ->first();
        $min = collect([$variantRange['min'], $baseRange?->min])->filter(fn ($value) => $value !== null)->min();
        $max = collect([$variantRange['max'], $baseRange?->max])->filter(fn ($value) => $value !== null)->max();
        $period = DB::table('special_programs')
            ->where('is_active', true)
            ->where(function ($query) {
                $query->whereNull('status')->orWhereNotIn('status', ['draft', 'disabled', 'archived']);
            })
            ->selectRaw('MIN(starts_at) as min_date, MAX(ends_at) as max_date')
            ->first();

        return [
            'categories' => $this->simpleFacet($base, 'category'),
            'target_participants' => [],
            'period' => [
                'min' => $period?->min_date ? Carbon::parse($period->min_date)->toDateString() : null,
                'max' => $period?->max_date ? Carbon::parse($period->max_date)->toDateString() : null,
            ],
            'quota_options' => [
                ['label' => 'Kuota tersedia', 'value' => 'true'],
            ],
            'price_types' => $this->priceTypeOptions(),
            'price_range' => ['min' => $min !== null ? (int) $min : null, 'max' => $max !== null ? (int) $max : null],
            'sorts' => $this->sortOptions('special-programs'),
        ];
    }

    private function souvenirFacets(): array
    {
        $base = $this->souvenirQuery();
        $range = (clone $base)->selectRaw('MIN(price) as min, MAX(price) as max')->first();

        return [
            'categories' => SouvenirCategory::query()
                ->where('is_active', true)
                ->withCount(['products as count' => fn ($query) => $query->where('status', 'active')->where('is_active', true)])
                ->having('count', '>', 0)
                ->orderBy('name')
                ->get()
                ->map(fn (SouvenirCategory $category) => ['label' => $category->name, 'value' => (string) $category->id, 'count' => (int) $category->count])
                ->values()
                ->all(),
            'stock_status' => [
                ['label' => 'Stok tersedia', 'value' => 'in_stock', 'count' => (clone $base)->where('stock', '>', 0)->count()],
                ['label' => 'Stok habis', 'value' => 'out_of_stock', 'count' => (clone $base)->where('stock', '<=', 0)->count()],
                ['label' => 'Stok menipis', 'value' => 'low_stock', 'count' => (clone $base)->whereColumn('stock', '<=', 'min_stock')->where('stock', '>', 0)->count()],
            ],
            'price_range' => ['min' => $range?->min !== null ? (int) $range->min : null, 'max' => $range?->max !== null ? (int) $range->max : null],
            'sorts' => $this->sortOptions('souvenirs'),
        ];
    }

    private function simpleFacet(Builder $base, string $column): array
    {
        return (clone $base)
            ->select($column, DB::raw('COUNT(*) as count'))
            ->whereNotNull($column)
            ->where($column, '!=', '')
            ->groupBy($column)
            ->orderBy($column)
            ->get()
            ->map(fn ($row) => ['label' => ucfirst((string) $row->{$column}), 'value' => (string) $row->{$column}, 'count' => (int) $row->count])
            ->values()
            ->all();
    }

    private function cityFacets(Builder $base, string $cityColumn): array
    {
        $rows = (clone $base)
            ->select($cityColumn, DB::raw('COUNT(*) as count'))
            ->whereNotNull($cityColumn)
            ->groupBy($cityColumn)
            ->orderByDesc('count')
            ->limit(30)
            ->get();

        $names = $this->cityNameMap($rows->pluck($cityColumn)->filter()->unique()->values());

        return $rows->map(fn ($row) => [
            'label' => $names[$row->{$cityColumn}] ?? (string) $row->{$cityColumn},
            'value' => (string) $row->{$cityColumn},
            'count' => (int) $row->count,
        ])->values()->all();
    }

    private function priceRange(string $table, string $column, callable $scope): array
    {
        $query = DB::table($table);
        $scope($query);
        $row = $query->selectRaw('MIN('.$column.') as min, MAX('.$column.') as max')->first();

        return [
            'min' => $row?->min !== null ? (int) $row->min : null,
            'max' => $row?->max !== null ? (int) $row->max : null,
        ];
    }

    private function academyDurationRange(): array
    {
        $row = DB::table('academy_classes')
            ->where('is_active', true)
            ->selectRaw('MIN(duration_minutes) as min, MAX(duration_minutes) as max')
            ->first();

        return [
            'min' => $row?->min !== null ? (int) $row->min : null,
            'max' => $row?->max !== null ? (int) $row->max : null,
        ];
    }

    private function paginationMeta(LengthAwarePaginator $paginator, string $type, array $filters): array
    {
        return [
            'total' => $paginator->total(),
            'current_page' => $paginator->currentPage(),
            'per_page' => $paginator->perPage(),
            'last_page' => $paginator->lastPage(),
            'from' => $paginator->firstItem(),
            'to' => $paginator->lastItem(),
            'applied_filters' => $this->appliedFilters($filters),
            'available_sorts' => array_column($this->sortOptions($type), 'value'),
        ];
    }

    private function appliedFilters(array $filters): array
    {
        return collect($filters)
            ->except(['page', 'per_page'])
            ->filter(fn ($value, $key) => ! $this->isEmptyValue($value) && ! ($key === 'sort' && $value === 'relevant') && ! ($key === 'price_type' && $value === 'all') && ! ($key === 'stock_status' && $value === 'all'))
            ->all();
    }

    private function sortOptions(string $type): array
    {
        $common = [
            ['label' => 'Paling Relevan', 'value' => 'relevant'],
            ['label' => 'Populer', 'value' => 'popular'],
            ['label' => 'Terbaru', 'value' => 'newest'],
            ['label' => 'Harga Termurah', 'value' => 'price_low'],
            ['label' => 'Harga Termahal', 'value' => 'price_high'],
            ['label' => 'Nama A-Z', 'value' => 'title'],
        ];

        return match ($type) {
            'events' => array_merge($common, [['label' => 'Segera Berlangsung', 'value' => 'upcoming']]),
            'hotels' => array_merge($common, [['label' => 'Rating Tertinggi', 'value' => 'rating_high']]),
            'academy' => array_merge($common, [['label' => 'Segera Berlangsung', 'value' => 'upcoming']]),
            'special-programs' => array_merge($common, [['label' => 'Segera Berlangsung', 'value' => 'upcoming']]),
            'souvenirs' => array_merge($common, [['label' => 'Stok Terbanyak', 'value' => 'stock_high']]),
            default => $common,
        };
    }

    private function normalizeSort(string $type, mixed $sort): string
    {
        $sort = trim((string) ($sort ?: 'relevant'));
        $allowed = array_column($this->sortOptions($type), 'value');

        return in_array($sort, $allowed, true) ? $sort : 'relevant';
    }

    private function popularKeywords(string $type, ?string $query = null): array
    {
        $keywords = self::POPULAR_KEYWORDS[$type] ?? [];

        if (Schema::hasTable('search_logs')) {
            try {
                $logged = DB::table('search_logs')
                    ->select('keyword', DB::raw('COUNT(*) as total'))
                    ->where('product_type', $type)
                    ->whereNotNull('keyword')
                    ->where('keyword', '!=', '')
                    ->when($query, fn ($builder) => $builder->where('keyword', 'like', '%'.$query.'%'))
                    ->groupBy('keyword')
                    ->orderByDesc('total')
                    ->limit(5)
                    ->pluck('keyword')
                    ->all();
                $keywords = array_values(array_unique(array_merge($logged, $keywords)));
            } catch (\Throwable) {
                // Fallback static keywords are enough when analytics table is unavailable.
            }
        }

        if ($query) {
            $lower = strtolower($query);
            $keywords = array_values(array_filter($keywords, fn ($keyword) => str_contains(strtolower($keyword), $lower)));
        }

        return array_slice($keywords, 0, 8);
    }

    private function recommendedFilters(string $type): array
    {
        return match ($type) {
            'events' => [
                ['key' => 'sort', 'label' => 'Segera berlangsung', 'value' => 'upcoming'],
                ['key' => 'price_type', 'label' => 'Gratis', 'value' => 'free'],
            ],
            'hotels' => [
                ['key' => 'sort', 'label' => 'Rating tertinggi', 'value' => 'rating_high'],
                ['key' => 'rooms', 'label' => '1 kamar', 'value' => '1'],
            ],
            'wisata' => [
                ['key' => 'category', 'label' => 'Wisata keluarga', 'value' => 'keluarga'],
                ['key' => 'sort', 'label' => 'Harga termurah', 'value' => 'price_low'],
            ],
            'academy' => [
                ['key' => 'sort', 'label' => 'Jadwal terdekat', 'value' => 'upcoming'],
                ['key' => 'price_type', 'label' => 'Gratis', 'value' => 'free'],
            ],
            'special-programs' => [
                ['key' => 'sort', 'label' => 'Program unggulan', 'value' => 'popular'],
                ['key' => 'quota_available', 'label' => 'Kuota tersedia', 'value' => 'true'],
            ],
            'souvenirs' => [
                ['key' => 'stock_status', 'label' => 'Stok tersedia', 'value' => 'in_stock'],
                ['key' => 'sort', 'label' => 'Stok terbanyak', 'value' => 'stock_high'],
            ],
        };
    }

    private function emptyState(string $type): array
    {
        return match ($type) {
            'events' => ['title' => 'Event tidak ditemukan', 'message' => 'Coba kata kunci event, kota, atau tanggal lain.', 'recommended_keywords' => self::POPULAR_KEYWORDS['events']],
            'hotels' => ['title' => 'Hotel tidak ditemukan', 'message' => 'Coba ubah kota, tanggal, jumlah tamu, atau filter harga.', 'recommended_keywords' => self::POPULAR_KEYWORDS['hotels']],
            'wisata' => ['title' => 'Destinasi tidak ditemukan', 'message' => 'Coba destinasi, kota, atau kategori wisata lain.', 'recommended_keywords' => self::POPULAR_KEYWORDS['wisata']],
            'academy' => ['title' => 'Kelas tidak ditemukan', 'message' => 'Coba topik, kategori, atau level pembelajaran lain.', 'recommended_keywords' => self::POPULAR_KEYWORDS['academy']],
            'special-programs' => ['title' => 'Program tidak ditemukan', 'message' => 'Coba kategori meeting, wedding, travel, atau kata kunci benefit lain.', 'recommended_keywords' => self::POPULAR_KEYWORDS['special-programs']],
            'souvenirs' => ['title' => 'Produk tidak ditemukan', 'message' => 'Coba nama produk, SKU, atau kategori retail lain.', 'recommended_keywords' => self::POPULAR_KEYWORDS['souvenirs']],
        };
    }

    private function priceTypeOptions(): array
    {
        return [
            ['label' => 'Semua', 'value' => 'all'],
            ['label' => 'Gratis', 'value' => 'free'],
            ['label' => 'Berbayar', 'value' => 'paid'],
        ];
    }

    private function cityCodes(string $term): array
    {
        $term = trim($term);
        if ($term === '') {
            return [];
        }

        return DB::table('regencies')
            ->where('code', $term)
            ->orWhere('name', 'like', '%'.$term.'%')
            ->limit(30)
            ->pluck('code')
            ->all();
    }

    private function cityNameMap(Collection $codes): array
    {
        if ($codes->isEmpty()) {
            return [];
        }

        return DB::table('regencies')
            ->whereIn('code', $codes->all())
            ->pluck('name', 'code')
            ->all();
    }

    private function dateRange(string $checkIn, string $checkOut): array
    {
        $start = Carbon::parse($checkIn)->startOfDay();
        $end = Carbon::parse($checkOut)->startOfDay();
        if (! $end->greaterThan($start)) {
            return [];
        }

        $dates = [];
        for ($date = $start->copy(); $date->lessThan($end); $date->addDay()) {
            $dates[] = $date->toDateString();
        }

        return $dates;
    }

    private function parseList(mixed $value): array
    {
        if ($value === null || $value === '') {
            return [];
        }

        $items = is_array($value) ? $value : explode(',', (string) $value);

        return collect($items)
            ->map(fn ($item) => trim((string) $item))
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    private function cleanText(?string $value): ?string
    {
        $value = trim((string) $value);

        return $value === '' || in_array(strtolower($value), ['null', 'undefined'], true) ? null : $value;
    }

    private function isEmptyValue(mixed $value): bool
    {
        if ($value === null || $value === '') {
            return true;
        }

        if (is_array($value)) {
            return count($value) === 0;
        }

        return false;
    }

    private function encryptedId(int|string $id): string
    {
        return Crypt::encryptString((string) $id);
    }

    private function storageUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        if (str_starts_with($path, 'http') || str_starts_with($path, '/')) {
            return $path;
        }

        return Storage::url($path);
    }

    private function eventImage(Event $event): string
    {
        $path = $event->image_path ?? null;

        return $this->storageUrl($path) ?? '/images/placeholder-card.jpg';
    }

    private function wisataImage(MitraWisataOnboarding $destination): ?string
    {
        $path = $destination->photo_gate_path ?: ($destination->photo_area_path ?: $destination->photo_ticket_path);

        return $this->storageUrl($path);
    }

    private function priceLabel(?int $price): ?string
    {
        if ($price === null) {
            return null;
        }

        if ($price <= 0) {
            return 'Gratis';
        }

        return 'Rp'.number_format($price, 0, ',', '.');
    }

    private function priceBadge(?int $price, string $fallback): string
    {
        if ($price === null) {
            return $fallback;
        }

        return $price <= 0 ? 'Gratis' : 'Berbayar';
    }

    private function facilityLabel(string $facility): string
    {
        return ucwords(str_replace(['_', '-'], ' ', $facility));
    }

    private function typeLabel(string $type): string
    {
        return match ($type) {
            'events' => 'Event',
            'hotels' => 'Hotel',
            'wisata' => 'Wisata/Tiket',
            'academy' => 'Academy/Kursus',
            'special-programs' => 'Special Program',
            'souvenirs' => 'Souvenir/Retail',
        };
    }
}
