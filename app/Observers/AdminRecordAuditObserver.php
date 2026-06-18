<?php

namespace App\Observers;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;

class AdminRecordAuditObserver
{
    public function creating(Model $model): void
    {
        $userId = Auth::id();

        if (! $userId || ! $this->hasAuditColumns($model)) {
            return;
        }

        $model->forceFill([
            'created_by' => $model->getAttribute('created_by') ?: $userId,
            'updated_by' => $model->getAttribute('updated_by') ?: $userId,
        ]);
    }

    public function updating(Model $model): void
    {
        $userId = Auth::id();

        if (! $userId || ! $this->hasAuditColumns($model)) {
            return;
        }

        $model->forceFill([
            'updated_by' => $userId,
        ]);
    }

    private function hasAuditColumns(Model $model): bool
    {
        static $cache = [];

        $table = $model->getTable();

        if (! array_key_exists($table, $cache)) {
            $cache[$table] = Schema::hasColumn($table, 'created_by')
                && Schema::hasColumn($table, 'updated_by');
        }

        return $cache[$table];
    }
}
