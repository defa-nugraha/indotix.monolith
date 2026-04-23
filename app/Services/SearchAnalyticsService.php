<?php

namespace App\Services;

use App\Models\SearchLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class SearchAnalyticsService
{
    public function record(Request $request, string $productType, array $filters, int $resultCount): void
    {
        $keyword = trim((string) ($filters['q'] ?? ''));
        $meaningfulFilters = collect($filters)
            ->except(['page', 'per_page'])
            ->filter(fn ($value) => ! $this->isEmptyValue($value))
            ->all();

        if ($keyword === '' && $meaningfulFilters === []) {
            return;
        }

        try {
            if (! Schema::hasTable('search_logs')) {
                return;
            }

            SearchLog::query()->create([
                'product_type' => $productType,
                'keyword' => $keyword !== '' ? mb_substr($keyword, 0, 255) : null,
                'filters' => $meaningfulFilters ?: null,
                'result_count' => max(0, $resultCount),
                'user_id' => $request->user('sanctum')?->id,
                'ip_address' => $request->ip(),
                'user_agent' => mb_substr((string) $request->userAgent(), 0, 1000),
            ]);
        } catch (\Throwable $exception) {
            Log::debug('Discovery search analytics skipped.', [
                'product_type' => $productType,
                'message' => $exception->getMessage(),
            ]);
        }
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
}
