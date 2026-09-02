<?php

test('public history returns wisata bookings only after product retirement', function () {
    $controller = file_get_contents(__DIR__.'/../../app/Http/Controllers/PublicHistoryController.php');

    expect($controller)
        ->toContain('$bookings = $wisataBookings->sortByDesc')
        ->toContain("'type' => 'wisata'")
        ->not->toContain('->concat($hotelBookings)')
        ->not->toContain('->concat($eventBookings)')
        ->not->toContain('->concat($specialProgramBookings)')
        ->not->toContain('->concat($souvenirOrders)')
        ->not->toContain('->concat($academyBookings)');
});
