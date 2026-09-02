<?php

use App\Support\HtmlSanitizer;

test('html sanitizer removes executable html but keeps safe formatting', function () {
    $clean = HtmlSanitizer::clean(
        '<h2 onclick="alert(1)">Judul</h2><p>Konten <strong>aman</strong></p><script>alert(1)</script><a href="javascript:alert(1)" onmouseover="alert(2)">klik</a>'
    );

    expect($clean)
        ->toContain('<h2>Judul</h2>')
        ->toContain('<strong>aman</strong>')
        ->toContain('rel="noopener noreferrer"')
        ->toContain('target="_blank"')
        ->toContain('>klik</a>')
        ->not->toContain('script')
        ->not->toContain('alert(1)')
        ->not->toContain('onclick')
        ->not->toContain('javascript:');
});

test('html sanitizer keeps utf8 content without latin1 artifacts', function () {
    $clean = HtmlSanitizer::clean('<p>Tentang wisata Indonesia&nbsp;</p><p>Aman &amp; nyaman</p>');

    expect($clean)
        ->toContain('Tentang wisata Indonesia')
        ->toContain('Aman &amp; nyaman')
        ->not->toContain('Â');
});
