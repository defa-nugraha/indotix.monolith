<?php

it('does not let the wisata destination wildcard swallow the history route', function () {
    $response = $this->get('/wisata/history');

    $response->assertRedirect(route('login'));
});

it('builds the e-ticket route with an encrypted booking identifier', function () {
    $encryptedId = encrypt('123');

    expect(route('wisata.booking.ticket', ['booking' => $encryptedId]))
        ->toContain('/wisata/booking/')
        ->toEndWith('/ticket')
        ->not->toContain('/wisata/booking/123/ticket');
});
