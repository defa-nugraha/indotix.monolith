<?php

// Local documentation server; isolates uploaded fixtures from existing app storage.
$_SERVER['LARAVEL_STORAGE_PATH'] = '/tmp/indotix-guide-storage';
$public = dirname(__DIR__, 3).'/public';
$uri = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
if (str_starts_with($uri, '/storage/')) {
    $base = '/tmp/indotix-guide-storage/app/public';
    $file = realpath($base.'/'.substr($uri, 9));
    if (! $file || ! str_starts_with($file, $base.'/') || ! is_file($file)) {
        http_response_code(404);
        exit;
    }
    header('Content-Type: '.mime_content_type($file));
    header('X-Content-Type-Options: nosniff');
    readfile($file);
    exit;
}
$file = realpath($public.$uri);
if ($uri !== '/' && $file && str_starts_with($file, $public.'/') && is_file($file)) {
    return false;
}
require $public.'/index.php';
