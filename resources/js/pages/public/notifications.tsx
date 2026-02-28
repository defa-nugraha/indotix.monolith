import { Head, Link, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Bell, CalendarCheck, MapPinned, MessageCircle, ShoppingBag, Star, Ticket, UserCircle, History as HistoryIcon, CheckCircle, CreditCard, Clock, Filter, ShoppingCart, BookOpen } from 'lucide-react';
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

export default function Notifications({ notifications = [] }: { notifications: NotificationItem[] }) {
    const { auth, unread_notifications, souvenir_cart_count } = usePage().props as { auth?: { user?: any }; unread_notifications?: number; souvenir_cart_count?: number };
    const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');
    const [categoryFilter, setCategoryFilter] = useState<'all' | 'hotel' | 'wisata' | 'event' | 'special_program' | 'souvenir' | 'academy'>('all');
    const [query, setQuery] = useState('');

    const categories = [
        { label: 'Wisata', icon: MapPinned, href: '/wisata' },
        { label: 'Event', icon: CalendarCheck, href: '/events' },
        { label: 'Retail Shop', icon: ShoppingBag, href: '/souvenir' },
        { label: 'Spesial Program', icon: Star, href: '/special-programs' },
        { label: 'Academy', icon: BookOpen, href: '/academy' },
        { label: 'Hotel', icon: Ticket, href: '/stay' },
    ];

    const chips = ['Alam', 'Budaya', 'Edukasi', 'Kuliner', 'Desa Wisata', 'Religi', 'Pantai', 'Gunung', 'Taman Nasional', 'Air Terjun', 'Danau'];

    const iconByType: Record<string, any> = {
        booking_created: Ticket,
        payment_pending: CreditCard,
        payment_paid: CheckCircle,
        booking_cancelled: Bell,
        booking_expired: Clock,
        event_booking_created: Ticket,
        event_payment_pending: CreditCard,
        event_payment_paid: CheckCircle,
        event_booking_expired: Clock,
        academy_booking_created: Ticket,
        academy_payment_pending: CreditCard,
        academy_payment_paid: CheckCircle,
        academy_booking_expired: Clock,
        souvenir_booking_created: Ticket,
        souvenir_payment_pending: CreditCard,
        souvenir_payment_paid: CheckCircle,
        souvenir_booking_expired: Clock,
        special_program_booking_created: Ticket,
        special_program_payment_pending: CreditCard,
        special_program_payment_paid: CheckCircle,
        special_program_booking_expired: Clock,
    };

    const filteredNotifications = useMemo(() => {
        return notifications.filter((item) => {
            if (activeFilter === 'unread' && item.is_read) return false;
            const category = item.data?.category
                ?? (item.type?.startsWith('wisata_')
                    ? 'wisata'
                    : item.type?.startsWith('event_')
                        ? 'event'
                        : item.type?.startsWith('souvenir_')
                            ? 'souvenir'
                        : item.type?.startsWith('academy_')
                            ? 'academy'
                        : item.type?.startsWith('special_program_')
                            ? 'special_program'
                            : 'hotel');
            if (categoryFilter !== 'all' && category !== categoryFilter) return false;
            const haystack = `${item.title} ${item.message}`.toLowerCase();
            return query.trim().length === 0 ? true : haystack.includes(query.toLowerCase());
        });
    }, [notifications, activeFilter, categoryFilter, query]);

    return (
        <PublicLayout categories={categories} chips={chips}>
            <Head title="Notifikasi">
                <link href="https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700|space-grotesk:500,600,700" rel="stylesheet" />
            </Head>

                        <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">Notifikasi</h1>
                            <p className="mt-2 text-sm text-slate-500">Informasi terbaru tentang pesanan dan pembayaranmu.</p>
                        </div>
                        <button
                            type="button"
                            className="rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold text-white"
                            onClick={() => {
                                router.post('/notifications/read-all', {}, {
                                    onSuccess: () => Swal.fire({ title: 'Berhasil', text: 'Semua notifikasi dibaca.', icon: 'success' }),
                                });
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
                                    onClick={() => setActiveFilter(item.id as any)}
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
                        <div className="flex flex-wrap gap-2">
                            {[
                                { id: 'all', label: 'Semua' },
                                { id: 'hotel', label: 'Hotel' },
                                { id: 'wisata', label: 'Wisata' },
                                { id: 'event', label: 'Event' },
                                { id: 'souvenir', label: 'Retail Shop' },
                                { id: 'special_program', label: 'Special Program' },
                                { id: 'academy', label: 'Academy' },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setCategoryFilter(item.id as any)}
                                    className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                                        categoryFilter === item.id
                                            ? 'bg-emerald-500 text-white'
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
                                onChange={(event) => setQuery(event.target.value)}
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
                        <h2 className="mt-4 text-lg font-semibold text-slate-900">Belum ada notifikasi</h2>
                        <p className="mt-2 text-sm text-slate-500">Notifikasi akan muncul saat ada aktivitas terbaru.</p>
                    </div>
                )}

                {filteredNotifications.length > 0 && (
                    <div className="mt-6 grid gap-4">
                        {filteredNotifications.map((item) => {
                            const Icon = iconByType[item.type] ?? Bell;
                            return (
                                <div key={item.id} className={`rounded-2xl bg-white p-5 shadow-sm ${item.is_read ? '' : 'border border-sky-100'}`}>
                                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${item.is_read ? 'bg-slate-100 text-slate-500' : 'bg-sky-100 text-sky-600'}`}>
                                                <Icon className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                                                    {!item.is_read && <span className="rounded-full bg-sky-600 px-2 py-0.5 text-[10px] font-semibold text-white">BARU</span>}
                                                </div>
                                                <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                                                <div className="mt-2 text-xs text-slate-500">
                                                    {item.created_at ? new Date(item.created_at).toLocaleString('id-ID') : ''}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            {item.data?.booking_id && (
                                                <Link
                                                    href={
                                                        item.data?.category === 'wisata'
                                                            ? `/wisata/booking/${item.data.booking_id}`
                                                            : item.data?.category === 'event'
                                                                ? `/events/booking/${item.data.booking_id}`
                                                                : item.data?.category === 'souvenir'
                                                                    ? `/souvenir/booking/${item.data.booking_id}`
                                                                : item.data?.category === 'special_program'
                                                                    ? `/special-programs/booking/${item.data.booking_id}`
                                                                    : `/booking/${item.data.booking_id}`
                                                    }
                                                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:border-sky-300 hover:text-sky-600"
                                                >
                                                    Lihat Detail
                                                </Link>
                                            )}
                                            {!item.is_read && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        router.post(`/notifications/${item.id}/read`, {}, {
                                                            onSuccess: () => Swal.fire({ title: 'Berhasil', text: 'Notifikasi ditandai dibaca.', icon: 'success' }),
                                                        });
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
                        <Link href="/"><img src="/logo.png" alt="Indotix" className="h-11 w-36 object-contain" /></Link>
                        <p className="mt-3 text-sm text-slate-600">
                            Neo Soho Capital 40th Floor<br />
                            Jl. Tanjung Duren Raya No 1<br />
                            Jakarta Barat, DKI Jakarta 11470
                        </p>
                        <p className="mt-4 text-sm text-slate-600">0812 9205 9888</p>
                        <p className="text-sm text-slate-600">info@indotix.co.id</p>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900">Layanan</h4>
                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                            <li>Wisata</li>
                            <li>Special Program</li>
                            <li>Event</li>
                            <li>Hotel</li>
                            <li>Retail Shop</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900">Perusahaan</h4>
                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                            <li>Tentang Kami</li>
                            <li>Karir</li>
                            <li>Blog</li>
                            <li>Kebijakan Privasi</li>
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
