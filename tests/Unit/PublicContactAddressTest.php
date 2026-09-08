<?php

use App\Models\PublicContact;

test('legacy address preserves real and escaped line breaks', function () {
    $contact = new PublicContact(['address' => "Kantor & layanan\nJakarta\\nIndonesia"]);
    expect($contact->address_html)->toBe("Kantor &amp; layanan<br />\nJakarta<br />\nIndonesia");
});

test('legacy unsafe html is sanitized on read without changing stored address', function () {
    $raw = '<p><em>Jakarta</em><img src=x onerror=alert(1)></p><script>alert(1)</script>';
    $contact = new PublicContact(['address' => $raw]);
    expect($contact->toArray()['address_html'])->toBe('<p><em>Jakarta</em></p>');
    expect($contact->address)->toBe($raw);
});

test('empty contact addresses remain empty', function () {
    expect((new PublicContact)->address_html)->toBeNull();
    expect((new PublicContact(['address' => '']))->address_html)->toBe('');
});
