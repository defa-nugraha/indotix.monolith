<?php

return [
    'enabled' => env('API_CACHE_ENABLED', true),
    'store' => env('API_CACHE_STORE', 'redis'),
    'ttl' => (int) env('API_CACHE_TTL', 60),
    'version_key' => env('API_CACHE_VERSION_KEY', 'public-api:content-version'),
];
