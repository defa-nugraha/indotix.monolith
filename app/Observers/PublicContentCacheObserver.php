<?php

namespace App\Observers;

use App\Services\PublicContentCache;
use Illuminate\Database\Eloquent\Model;

class PublicContentCacheObserver
{
    public function __construct(private readonly PublicContentCache $cache) {}

    public function saved(Model $model): void
    {
        $this->cache->invalidate();
    }

    public function deleted(Model $model): void
    {
        $this->cache->invalidate();
    }

    public function restored(Model $model): void
    {
        $this->cache->invalidate();
    }
}
