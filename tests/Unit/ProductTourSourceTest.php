<?php

test('product tour uses page specific versioned definitions instead of generic fallbacks', function () {
    $tour = file_get_contents(__DIR__.'/../../resources/js/components/coach-marks.tsx');

    expect($tour)
        ->toContain('type TourDefinition')
        ->toContain('tourDefinitions')
        ->toContain("id: 'public.home.v1'")
        ->toContain("id: 'admin.public.home.v1'")
        ->toContain("id: 'admin.public.entry-qr.v1'")
        ->toContain("id: 'admin.wisata.tickets.v1'")
        ->toContain("id: 'mitra.wisata.destination.v1'")
        ->toContain("id: 'mitra.wisata.scans.v1'")
        ->toContain('tourDefinition?.id ?? guidePath')
        ->toContain('return definition?.steps(path, role) ?? []')
        ->toContain('Promo Spesial Untukmu')
        ->toContain('Poster QR masuk')
        ->toContain('Pilih konteks tiket')
        ->not->toContain('Cari produk lebih cepat')
        ->not->toContain('Lihat rekomendasi dan daftar produk')
        ->not->toContain('Tabel dan aksi data');
});

test('product tour targets are attached to business critical pages', function () {
    $home = file_get_contents(__DIR__.'/../../resources/js/pages/welcome.tsx');
    $adminHome = file_get_contents(__DIR__.'/../../resources/js/pages/admin/public/home/edit.tsx');
    $entryQr = file_get_contents(__DIR__.'/../../resources/js/pages/admin/public/entry-qr/edit.tsx');
    $mitraScans = file_get_contents(__DIR__.'/../../resources/js/pages/mitra/wisata/scans/index.tsx');
    $mitraDestination = file_get_contents(__DIR__.'/../../resources/js/pages/mitra/wisata/destination.tsx');
    $adminTickets = file_get_contents(__DIR__.'/../../resources/js/pages/admin/wisata/tickets/index.tsx');

    expect($home)
        ->toContain('data-coach="home-special-promo"')
        ->toContain('data-coach="home-category-products"');

    expect($adminHome)
        ->toContain('data-coach="public-home-tabs"')
        ->toContain('data-coach="public-home-special-promo"')
        ->toContain('data-coach="public-home-part-of-logos"')
        ->toContain('data-coach="public-home-save"');

    expect($entryQr)
        ->toContain('data-coach="entry-qr-text"')
        ->toContain('data-coach="entry-qr-images"')
        ->toContain('data-coach="entry-qr-save"');

    expect($mitraScans)
        ->toContain('data-coach="mitra-scan-tabs"')
        ->toContain('data-coach="mitra-entry-qr-preview"')
        ->toContain('data-coach="mitra-entry-qr-actions"')
        ->toContain('data-coach="mitra-scan-history-filter"')
        ->toContain('data-coach="mitra-scan-history-table"');

    expect($mitraDestination)
        ->toContain('data-coach="mitra-destination-responsible"')
        ->toContain('data-coach="mitra-destination-info"')
        ->toContain('data-coach="mitra-destination-photo"')
        ->toContain('data-coach="mitra-destination-save"');

    expect($adminTickets)
        ->toContain('data-coach="admin-wisata-ticket-filters"')
        ->toContain('data-coach="admin-wisata-ticket-destinations"')
        ->toContain('data-coach="admin-wisata-ticket-table"')
        ->toContain('data-coach="admin-wisata-ticket-create"');
});
