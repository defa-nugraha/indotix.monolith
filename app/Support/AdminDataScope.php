<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class AdminDataScope
{
    public static function canViewAll(?User $user): bool
    {
        return $user?->role === 'admin';
    }

    public static function applyCreatedBy(Builder $query, Request|User|null $actor, string $column = 'created_by'): Builder
    {
        $user = $actor instanceof Request ? $actor->user() : $actor;

        if (self::canViewAll($user)) {
            return $query;
        }

        return $query->where($column, $user?->id ?? 0);
    }

    public static function authorizeCreatedBy(Model $model, Request|User|null $actor, string $column = 'created_by'): void
    {
        $user = $actor instanceof Request ? $actor->user() : $actor;

        if (self::canViewAll($user)) {
            return;
        }

        abort_unless((int) $model->getAttribute($column) === (int) ($user?->id ?? 0), 404);
    }
}
