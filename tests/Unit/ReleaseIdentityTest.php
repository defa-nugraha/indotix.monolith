<?php

use App\Http\Middleware\AddReleaseIdentity;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Process\Process;

test('health identifies running release without exposing deployment metadata', function () {
    $file = tempnam(sys_get_temp_dir(), 'release-test-');
    $app = Mockery::mock(Application::class);
    $app->shouldReceive('basePath')->with('release.json')->andReturn($file);
    try {
        file_put_contents($file, json_encode(['release' => 'release-123', 'private' => 'hidden']));
        $middleware = new AddReleaseIdentity($app);
        $next = fn () => new Response('ok');
        $response = $middleware->handle(Request::create('/up'), $next);
        expect($response->headers->get('X-Indotix-Release'))->toBe('release-123');
        expect($response->headers->get('Cache-Control'))->toContain('no-store');
        expect($response->getContent())->toBe('ok');
        expect($middleware->handle(Request::create('/'), $next)->headers->has('X-Indotix-Release'))->toBeFalse();
        file_put_contents($file, '{}');
        expect($middleware->handle(Request::create('/up'), $next)->headers->has('X-Indotix-Release'))->toBeFalse();
    } finally {
        unlink($file);
        Mockery::close();
    }
});

test('health script rejects wrong release and redirects even when upload succeeded', function ($release, $status, $success) {
    $directory = sys_get_temp_dir().'/health-test-'.bin2hex(random_bytes(8));
    mkdir($directory, 0700);
    // Fake only the HTTP transport; execute the actual deployment health script.
    file_put_contents($directory.'/curl', <<<'BASH'
#!/usr/bin/env bash
set -eu
while (($#)); do
    if [[ "$1" == '--dump-header' ]]; then
        printf 'HTTP/2 %s\r\nX-Indotix-Release: %s\r\n\r\n' "$TEST_STATUS" "$TEST_RELEASE" > "$2"
        shift
    fi
    shift
done
printf '%s' "$TEST_STATUS"
BASH);
    chmod($directory.'/curl', 0700);
    try {
        $process = new Process(['bash', dirname(__DIR__, 2).'/deploy/health-check.sh', 'https://example.test/up', 'https://example.test/wisata'], null, [
            'PATH' => $directory.':'.getenv('PATH'),
            'EXPECTED_RELEASE' => 'new-release',
            'TEST_RELEASE' => $release,
            'TEST_STATUS' => $status,
        ]);
        $process->run();
        expect($process->isSuccessful())->toBe($success);
    } finally {
        unlink($directory.'/curl');
        rmdir($directory);
    }
})->with([
    ['new-release', '200', true],
    ['old-release', '200', false],
    ['', '200', false],
    ['new-release', '302', false],
    ['new-release', '500', false],
]);
