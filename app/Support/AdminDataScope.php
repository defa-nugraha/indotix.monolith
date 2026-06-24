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

    public static function applyCreatedByOrUser(Builder $query, Request|User|null $actor, string $createdByColumn = 'created_by', string $userColumn = 'user_id'): Builder
    {
        $user = $actor instanceof Request ? $actor->user() : $actor;

        if (self::canViewAll($user)) {
            return $query;
        }

        $userId = (int) ($user?->id ?? 0);

        return $query->where(function (Builder $builder) use ($createdByColumn, $userColumn, $userId) {
            $builder
                ->where($createdByColumn, $userId)
                ->orWhere($userColumn, $userId);
        });
    }

    public static function applyCreatedByOrColumn(Builder $query, Request|User|null $actor, string $ownerColumn, string $createdByColumn = 'created_by'): Builder
    {
        return self::applyCreatedByOrUser($query, $actor, $createdByColumn, $ownerColumn);
    }

    public static function authorizeCreatedBy(Model $model, Request|User|null $actor, string $column = 'created_by'): void
    {
        $user = $actor instanceof Request ? $actor->user() : $actor;

        if (self::canViewAll($user)) {
            return;
        }

        abort_unless((int) $model->getAttribute($column) === (int) ($user?->id ?? 0), 404);
    }

    public static function authorizeCreatedByOrUser(Model $model, Request|User|null $actor, string $createdByColumn = 'created_by', string $userColumn = 'user_id'): void
    {
        $user = $actor instanceof Request ? $actor->user() : $actor;

        if (self::canViewAll($user)) {
            return;
        }

        $userId = (int) ($user?->id ?? 0);
        $ownsRecord = (int) $model->getAttribute($createdByColumn) === $userId
            || (int) $model->getAttribute($userColumn) === $userId;

        abort_unless($ownsRecord, 404);
    }

    public static function authorizeCreatedByOrColumn(Model $model, Request|User|null $actor, string $ownerColumn, string $createdByColumn = 'created_by'): void
    {
        self::authorizeCreatedByOrUser($model, $actor, $createdByColumn, $ownerColumn);
    }
}
