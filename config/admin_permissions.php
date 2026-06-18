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
        'hotel_properties' => [
            'label' => 'Hotel - Properti',
            'parent' => 'Hotel',
            'patterns' => ['hotels.*'],
            'paths' => ['hotels*'],
        ],
        'hotel_rooms' => [
            'label' => 'Hotel - Kamar & Inventory',
            'parent' => 'Hotel',
            'patterns' => ['room-types.*', 'room-inventories.*'],
            'paths' => ['room-types*', 'room-inventories*'],
        ],
        'hotel_bookings' => [
            'label' => 'Hotel - Booking',
            'parent' => 'Hotel',
            'patterns' => ['admin.bookings.*'],
            'paths' => ['admin/bookings*'],
        ],
        'hotel_finance' => [
            'label' => 'Hotel - Keuangan & Payout',
            'parent' => 'Hotel',
            'patterns' => ['admin.finance.*', 'admin.payouts.*'],
            'paths' => ['admin/finance*'],
        ],
        'hotel_vouchers' => [
            'label' => 'Hotel - Voucher',
            'parent' => 'Hotel',
            'patterns' => ['admin.vouchers.*'],
            'paths' => ['admin/marketing/vouchers*'],
        ],
        'mitra' => [
            'label' => 'Kelola Mitra',
            'patterns' => ['admin.mitra.*', 'admin.mitra-wisata.*', 'admin.events.organizers.*'],
            'paths' => ['admin/mitra*', 'admin/mitra-wisata*', 'admin/events/organizers*'],
        ],
        'wisata_destinations' => [
            'label' => 'Wisata - Destinasi',
            'parent' => 'Wisata',
            'patterns' => ['admin.wisata.destinations.*'],
            'paths' => ['admin/wisata/destinations*'],
        ],
        'wisata_tickets' => [
            'label' => 'Wisata - Tiket',
            'parent' => 'Wisata',
            'patterns' => ['admin.wisata.tickets.*'],
            'paths' => ['admin/wisata/tickets*'],
        ],
        'wisata_bookings' => [
            'label' => 'Wisata - Booking & Scan',
            'parent' => 'Wisata',
            'patterns' => ['admin.wisata.bookings.*', 'admin.wisata.scans.*'],
            'paths' => ['admin/wisata/bookings*', 'admin/wisata/scans*'],
        ],
        'wisata_finance' => [
            'label' => 'Wisata - Keuangan',
            'parent' => 'Wisata',
            'patterns' => ['admin.wisata.finance.*'],
            'paths' => ['admin/wisata/finance*'],
        ],
        'wisata_content' => [
            'label' => 'Wisata - Konten & Operasional',
            'parent' => 'Wisata',
            'patterns' => ['admin.wisata.content.*', 'admin.wisata.exceptions.*'],
            'paths' => ['admin/wisata/content*', 'admin/wisata/exceptions*'],
        ],
        'wisata_affiliates' => [
            'label' => 'Afiliasi Wisata',
            'patterns' => ['admin.wisata.affiliates.*'],
            'paths' => ['admin/wisata/affiliates*'],
        ],
        'events_items' => [
            'label' => 'Event - Event',
            'parent' => 'Event',
            'patterns' => ['admin.events.index', 'admin.events.show', 'admin.events.store', 'admin.events.update', 'admin.events.destroy'],
            'paths' => ['admin/events', 'admin/events/*'],
        ],
        'events_tickets' => [
            'label' => 'Event - Tiket',
            'parent' => 'Event',
            'patterns' => ['admin.events.tickets.*'],
            'paths' => ['admin/events/tickets*'],
        ],
        'events_bookings' => [
            'label' => 'Event - Booking & Peserta',
            'parent' => 'Event',
            'patterns' => ['admin.events.bookings.*', 'admin.events.attendees.*', 'admin.events.scans.*'],
            'paths' => ['admin/events/bookings*', 'admin/events/attendees*', 'admin/events/scans*'],
        ],
        'events_finance' => [
            'label' => 'Event - Keuangan',
            'parent' => 'Event',
            'patterns' => ['admin.events.finance.*'],
            'paths' => ['admin/events/finance*'],
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
