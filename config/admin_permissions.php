<?php

return [
    'actions' => [
        'view' => 'Lihat',
        'create' => 'Tambah',
        'update' => 'Ubah',
        'delete' => 'Hapus',
    ],

    'features' => [
        'users' => [
            'label' => 'Kelola User',
            'patterns' => ['admin.users.*'],
            'paths' => ['admin/users*'],
        ],
        'chat' => [
            'label' => 'Live Chat',
            'patterns' => ['admin.chat.*'],
            'paths' => ['admin/chat*'],
        ],
        'reviews' => [
            'label' => 'Ulasan Produk',
            'patterns' => ['admin.reviews.*'],
            'paths' => ['admin/reviews*'],
        ],
        'hotel' => [
            'label' => 'Hotel',
            'patterns' => ['hotels.*', 'room-types.*', 'room-inventories.*', 'admin.bookings.*', 'admin.finance.*', 'admin.payouts.*', 'admin.vouchers.*'],
            'paths' => ['hotels*', 'room-types*', 'room-inventories*', 'admin/bookings*', 'admin/finance*', 'admin/marketing/vouchers*'],
        ],
        'mitra' => [
            'label' => 'Kelola Mitra',
            'patterns' => ['admin.mitra.*', 'admin.mitra-wisata.*', 'admin.events.organizers.*'],
            'paths' => ['admin/mitra*', 'admin/mitra-wisata*', 'admin/events/organizers*'],
        ],
        'wisata' => [
            'label' => 'Wisata',
            'patterns' => ['admin.wisata.*'],
            'paths' => ['admin/wisata*'],
        ],
        'wisata_affiliates' => [
            'label' => 'Afiliasi Wisata',
            'patterns' => ['admin.wisata.affiliates.*'],
            'paths' => ['admin/wisata/affiliates*'],
        ],
        'events' => [
            'label' => 'Event',
            'patterns' => ['admin.events.*'],
            'paths' => ['admin/events*'],
        ],
        'academy' => [
            'label' => 'Eljohn Academy',
            'patterns' => ['admin.academy.*'],
            'paths' => ['admin/academy*'],
        ],
        'retail_shop' => [
            'label' => 'Retail Shop',
            'patterns' => ['admin.souvenir.*'],
            'paths' => ['admin/retail-shop*', 'admin/souvenir*'],
        ],
        'special_programs' => [
            'label' => 'Special Program',
            'patterns' => ['admin.special-programs.*'],
            'paths' => ['admin/special-programs*'],
        ],
        'blog' => [
            'label' => 'Jelajah Indotix',
            'patterns' => ['admin.blog.*'],
            'paths' => ['admin/blog*'],
        ],
        'public_content' => [
            'label' => 'Konten Publik',
            'patterns' => ['admin.public.*'],
            'paths' => ['admin/public*'],
        ],
        'system' => [
            'label' => 'Sistem, Audit & Kontrol',
            'patterns' => ['admin.system.*', 'admin.audit-logs.*'],
            'paths' => ['admin/system*'],
        ],
    ],
];
