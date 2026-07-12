<?php

test('public history combines booking arrays with base collection concat', function () {
    $controller = file_get_contents(__DIR__.'/../../app/Http/Controllers/PublicHistoryController.php');

    expect($controller)
        ->toContain('$bookings = collect()')
        ->toContain('->concat($hotelBookings)')
        ->toContain('->concat($wisataBookings)')
        ->toContain('->concat($eventBookings)')
        ->toContain('->concat($specialProgramBookings)')
        ->toContain('->concat($souvenirOrders)')
        ->toContain('->concat($academyBookings)')
        ->not->toContain('$bookings = $hotelBookings'.PHP_EOL.'            ->merge($wisataBookings)');
});
