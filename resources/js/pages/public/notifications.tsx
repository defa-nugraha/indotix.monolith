import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import {
    Bell,
    MapPinned,
    Ticket,
    CheckCircle,
    CreditCard,
    Clock,
    Filter,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { FooterDownloadSocial } from '@/components/footer-download-social';
import PublicLayout from '@/layouts/public-layout';

type NotificationItem = {
    id: number;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    data?: Record<string, any> | null;
    created_at?: string | null;
};

export default function Notifications({
    notifications = [],
}: {
    notifications: NotificationItem[];
}) {
    const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');
    const [query, setQuery] = useState('');

    const categories = [
        { label: 'Wisata', icon: MapPinned, href: '/wisata' },
    ];

    const chips = [
        'Alam',
        'Budaya',
        'Edukasi',
        'Kuliner',
        'Desa Wisata',
        'Religi',
        'Pantai',
        'Gunung',
        'Taman Nasional',
        'Air Terjun',
        'Danau',
    ];

    const iconByType: Record<string, any> = {
        booking_created: Ticket,
        payment_pending: CreditCard,
        payment_paid: CheckCircle,
        booking_cancelled: Bell,
        booking_expired: Clock,
        wisata_booking_created: Ticket,
        wisata_payment_pending: CreditCard,
        wisata_payment_paid: CheckCircle,
        wisata_booking_expired: Clock,
    };

    const filteredNotifications = useMemo(() => {
        return notifications.filter((item) => {
            if (activeFilter === 'unread' && item.is_read) return false;
            const category =
                item.data?.category ??
                (item.type?.startsWith('wisata_')
                    ? 'wisata'
                    : item.type?.startsWith('event_') ||
                        item.type?.startsWith('hotel_') ||
                        item.type?.startsWith('souvenir_') ||
                        item.type?.startsWith('academy_') ||
                        item.type?.startsWith('special_program_')
                      ? 'non_wisata'
                      : 'wisata');
            if (category !== 'wisata') return false;
            const haystack = `${item.title} ${item.message}`.toLowerCase();
            return query.trim().length === 0
                ? true
                : haystack.includes(query.toLowerCase());
        });
    }, [notifications, activeFilter, query]);

    return (
        <PublicLayout categories={categories} chips={chips}>
            <Head title="Notifikasi">
                <link
                    href="https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700|space-grotesk:500,600,700"
                    rel="stylesheet"
                />
            </Head>

            <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">
                                Notifikasi
                            </h1>
                            <p className="mt-2 text-sm text-slate-500">
                                Informasi terbaru tentang pesanan dan
                                pembayaranmu.
                            </p>
                        </div>
                        <button
                            type="button"
                            className="rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold text-white"
                            onClick={() => {
                                router.post(
                                    '/notifications/read-all',
                                    {},
                                    {
                                        onSuccess: () =>
                                            router.reload({
                                                only: ['notifications'],
                                            }),
                                        onFinish: () =>
                                            Swal.fire({
                                                title: 'Berhasil',
                                                text: 'Semua notifikasi dibaca.',
                                                icon: 'success',
                                            }),
                                    },
                                );
                            }}
                        >
                            Tandai semua dibaca
                        </button>
                    </div>
                </div>

                <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <Filter className="h-4 w-4 text-sky-500" />
                            Filter Notifikasi
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { id: 'all', label: 'Semua' },
                                { id: 'unread', label: 'Belum Dibaca' },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() =>
                                        setActiveFilter(item.id as any)
                                    }
                                    className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                                        activeFilter === item.id
                                            ? 'bg-sky-600 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm md:w-64">
                            <input
                                value={query}
                                onChange={(event) =>
                                    setQuery(event.target.value)
                                }
                                placeholder="Cari notifikasi"
                                className="w-full bg-transparent outline-none"
                            />
                        </div>
                    </div>
                </div>

                {filteredNotifications.length === 0 && (
                    <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sky-50 text-sky-600">
                            <Bell className="h-6 w-6" />
                        </div>
                        <h2 className="mt-4 text-lg font-semibold text-slate-900">
                            Belum ada notifikasi
                        </h2>
                        <p className="mt-2 text-sm text-slate-500">
                            Notifikasi akan muncul saat ada aktivitas terbaru.
                        </p>
                    </div>
                )}

                {filteredNotifications.length > 0 && (
                    <div className="mt-6 grid gap-4">
                        {filteredNotifications.map((item) => {
                            const Icon = iconByType[item.type] ?? Bell;
                            return (
                                <div
                                    key={item.id}
                                    className={`rounded-2xl bg-white p-5 shadow-sm ${item.is_read ? '' : 'border border-sky-100'}`}
                                >
                                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                        <div className="flex items-start gap-4">
                                            <div
                                                className={`flex h-12 w-12 items-center justify-center rounded-full ${item.is_read ? 'bg-slate-100 text-slate-500' : 'bg-sky-100 text-sky-600'}`}
                                            >
                                                <Icon className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-base font-semibold text-slate-900">
                                                        {item.title}
                                                    </h3>
                                                    {!item.is_read && (
                                                        <span className="rounded-full bg-sky-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                                                            BARU
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-1 text-sm text-slate-600">
                                                    {item.message}
                                                </p>
                                                <div className="mt-2 text-xs text-slate-500">
                                                    {item.created_at
                                                        ? new Date(
                                                              item.created_at,
                                                          ).toLocaleString(
                                                              'id-ID',
                                                          )
                                                        : ''}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            {item.data?.booking_id && (
                                                <Link
                                                    href={`/wisata/booking/${item.data.booking_id}`}
                                                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:border-sky-300 hover:text-sky-600"
                                                >
                                                    Lihat Detail
                                                </Link>
                                            )}
                                            {!item.is_read && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        router.post(
                                                            `/notifications/${item.id}/read`,
                                                            {},
                                                            {
                                                                onSuccess: () =>
                                                                    router.reload({
                                                                        only: [
                                                                            'notifications',
                                                                        ],
                                                                    }),
                                                                onFinish: () =>
                                                                    Swal.fire({
                                                                        title: 'Berhasil',
                                                                        text: 'Notifikasi ditandai dibaca.',
                                                                        icon: 'success',
                                                                    }),
                                                            },
                                                        );
                                                    }}
                                                    className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white"
                                                >
                                                    Tandai dibaca
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            <footer className="mt-10 border-t border-slate-200 bg-white">
                <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 md:grid-cols-4 md:px-8">
                    <div>
                        <Link href="/">
                            <img
                                src="/logo.png"
                                alt="Indotix"
                                className="h-11 w-36 object-contain"
                            />
                        </Link>
                        <p className="mt-3 text-sm text-slate-600">
                            Neo Soho Capital 40th Floor
                            <br />
                            Jl. Tanjung Duren Raya No 1<br />
                            Jakarta Barat, DKI Jakarta 11470
                        </p>
                        <p className="mt-4 text-sm text-slate-600">
                            0812 9205 9888
                        </p>
                        <p className="text-sm text-slate-600">
                            info@indotix.co.id
                        </p>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900">
                            Layanan
                        </h4>
                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                            <li>Wisata</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900">
                            Perusahaan
                        </h4>
                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                            <li>
                                <Link
                                    href="/about"
                                    className="transition hover:text-sky-600"
                                >
                                    Tentang Kami
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/jelajah"
                                    className="transition hover:text-sky-600"
                                >
                                    Blog
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/faq"
                                    className="transition hover:text-sky-600"
                                >
                                    FAQ
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/privacy-policy"
                                    className="transition hover:text-sky-600"
                                >
                                    Kebijakan Privasi
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <FooterDownloadSocial />
                </div>
                <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
                    © 2025 Indotix. All rights reserved.
                </div>
            </footer>
        </PublicLayout>
    );
}
