<?php

namespace App\Support;

use App\Models\CommissionRule;
use App\Models\EventCommission;
use App\Models\WisataCommissionRule;
use Illuminate\Database\Eloquent\Model;

class CommissionInfo
{
    public static function hotel(?int $hotelId = null): array
    {
        $rule = self::resolveRule(CommissionRule::query(), 'hotel_id', $hotelId, 'starts_at', 'ends_at');

        return self::format($rule, 'Komisi Hotel');
    }

    public static function wisata(?int $destinationId = null): array
    {
        $rule = self::resolveRule(WisataCommissionRule::query(), 'mitra_wisata_onboarding_id', $destinationId, 'start_date', 'end_date');

        return self::format($rule, 'Komisi Wisata', 'start_date', 'end_date');
    }

    public static function event(?int $eventId = null): array
    {
        $rule = self::resolveRule(EventCommission::query(), 'event_id', $eventId, 'starts_at', 'ends_at');

        return self::format($rule, 'Komisi Event');
    }

    private static function resolveRule($query, string $scopeColumn, ?int $scopeId, string $startColumn, string $endColumn): ?Model
    {
        $today = now()->toDateString();

        $base = fn ($builder) => $builder
            ->where(function ($dateQuery) use ($today, $startColumn) {
                $dateQuery->where('is_forever', true)
                    ->orWhereNull($startColumn)
                    ->orWhere($startColumn, '<=', $today);
            })
            ->where(function ($dateQuery) use ($today, $endColumn) {
                $dateQuery->where('is_forever', true)
                    ->orWhereNull($endColumn)
                    ->orWhere($endColumn, '>=', $today);
            })
            ->latest('id');

        if ($scopeId) {
            $specific = (clone $query)->where($scopeColumn, $scopeId);
            $rule = $base($specific)->first();
            if ($rule) {
                return $rule;
            }
        }

        return $base((clone $query)->whereNull($scopeColumn))->first();
    }

    private static function format(?Model $rule, string $title, string $startColumn = 'starts_at', string $endColumn = 'ends_at'): array
    {
        if (! $rule) {
            return [
                'title' => $title,
                'summary' => 'Komisi platform akan mengikuti kebijakan default INDOTIX.',
                'description' => 'Tim kami akan menginformasikan detail komisi saat proses review mitra.',
                'type' => null,
                'value' => null,
                'is_forever' => true,
                'starts_at' => null,
                'ends_at' => null,
            ];
        }

        $value = $rule->type === 'percentage'
            ? rtrim(rtrim(number_format((float) $rule->value, 2, ',', '.'), '0'), ',').'%'
            : 'Rp '.number_format((float) $rule->value, 0, ',', '.');

        $period = $rule->is_forever
            ? 'berlaku selamanya'
            : 'berlaku '.$rule->{$startColumn}?->format('d M Y').' sampai '.$rule->{$endColumn}?->format('d M Y');

        return [
            'title' => $title,
            'summary' => "Komisi platform saat ini {$value}.",
            'description' => "Komisi ini {$period}. Nilai komisi akan dipotong dari transaksi yang berhasil sebelum payout dikirimkan ke mitra.",
            'type' => $rule->type,
            'value' => (float) $rule->value,
            'is_forever' => (bool) $rule->is_forever,
            'starts_at' => $rule->{$startColumn}?->toDateString(),
            'ends_at' => $rule->{$endColumn}?->toDateString(),
        ];
    }
}
