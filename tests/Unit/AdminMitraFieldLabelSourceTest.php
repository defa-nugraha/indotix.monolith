<?php

it('keeps visible admin and mitra form controls labelled', function () {
    $basePath = dirname(__DIR__, 2);
    $roots = [
        $basePath.'/resources/js/pages/admin',
        $basePath.'/resources/js/pages/mitra',
    ];

    $unlabelled = [];
    $controlPattern = '/<(input|select|textarea|Input|Select|Textarea|Checkbox|Switch)\b/';
    $labelPattern = '/(<FormField\b|<Field\b|<Label\b|<label\b|aria-label=|aria-labelledby=|htmlFor=|FormLabel|sr-only)/';

    foreach ($roots as $root) {
        if (! is_dir($root)) {
            continue;
        }

        $files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root));

        foreach ($files as $file) {
            if (! $file->isFile() || ! in_array($file->getExtension(), ['tsx', 'jsx'], true)) {
                continue;
            }

            $lines = preg_split('/\R/', file_get_contents($file->getPathname()));

            foreach ($lines as $index => $line) {
                if (! preg_match($controlPattern, $line)) {
                    continue;
                }

                $tagBlock = implode("\n", array_slice($lines, $index, 8));
                if (preg_match('/type=["\']hidden["\']/', $tagBlock)) {
                    continue;
                }

                $context = implode("\n", array_slice($lines, max(0, $index - 8), 13));
                if (! preg_match($labelPattern, $context)) {
                    $relativePath = str_replace($basePath.DIRECTORY_SEPARATOR, '', $file->getPathname());
                    $unlabelled[] = "{$relativePath}:".($index + 1);
                }
            }
        }
    }

    expect($unlabelled)->toBe([]);
});
