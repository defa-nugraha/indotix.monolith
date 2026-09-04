<?php

test('wisata partner forms keep historical identifiers while using marketing terminology', function () {
    $destination = file_get_contents(__DIR__.'/../../resources/js/pages/mitra/wisata/destination.tsx');
    $onboarding = file_get_contents(__DIR__.'/../../resources/js/pages/mitra/wisata-onboarding.tsx');

    expect($destination)
        ->toContain("{ id: 'pokdarwis', label: 'Marketing' }")
        ->toContain("{ id: 'surat_pokdarwis', label: 'Surat Marketing' }")
        ->not->toContain("label: 'Pokdarwis'")
        ->not->toContain("label: 'Surat Pokdarwis'");

    expect($onboarding)
        ->toContain("{ id: 'pokdarwis', label: 'Marketing' }")
        ->toContain('Surat Marketing')
        ->not->toContain('Ketua Pokdarwis')
        ->not->toContain('Surat Pokdarwis');
});
