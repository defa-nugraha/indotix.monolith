import { Head, Link, router, usePage } from '@inertiajs/react';
import { Bell, CalendarCheck, History as HistoryIcon, MapPinned, MessageCircle, ShoppingBag, Star, Ticket, UserCircle, ShoppingCart, BadgePercent } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

type EventCard = {
    id: number;
    encrypted_id: string;
    title: string;
    city_name?: string | null;
    location?: string | null;
    start_at?: string | null;
    min_price?: number | null;
    image_url?: string | null;
};

export default function EventSearch({
    events = [],
    filters,
}: {
    events: EventCard[];
    filters: { q?: string | null };
}) {
    const { auth, unread_notifications, souvenir_cart_count, affiliate_menu } = usePage().props as {
        auth?: { user?: { role?: string } };
        unread_notifications?: number;
        souvenir_cart_count?: number;
        affiliate_menu?: boolean;
    };
    const [isReady, setIsReady] = useState(false);
    const [form, setForm] = useState({
        q: filters.q ?? '',
        visit_date: new Date().toISOString().slice(0, 10),
        quantity: 1,
    });

    useEffect(() => {
        const timer = setTimeout(() => setIsReady(true), 400);
        return () => clearTimeout(timer);
    }, []);

    const categories = [
        { label: 'Wisata', icon: MapPinned, href: '/wisata', active: false },
        { label: 'Event', icon: CalendarCheck, href: '/events', active: true },
        { label: 'Souvenir', icon: ShoppingBag, href: '/souvenir', active: false },
        { label: 'Spesial Program', icon: Star, href: '/special-programs', active: false },
        { label: 'Hotel', icon: Ticket, href: '/stay', active: false },
    ];
    const chips = ['Konser', 'Festival', 'Komunitas', 'Workshop', 'Olahraga', 'Keluarga', 'Kuliner', 'Seni', 'Budaya', 'Edukasi', 'Pameran'];

    const submitSearch = (event: React.FormEvent) => {
        event.preventDefault();
        router.get('/events', { q: form.q }, { preserveState: true, preserveScroll: true });
    };

    const filtered = useMemo(() => events, [events]);
    const fallbackImage = events.find((item) => item.image_url)?.image_url;

    return (
        <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
            <Head title="Event">
                <link href="https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700|space-grotesk:500,600,700" rel="stylesheet" />
            </Head>
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-4 py-4 md:px-8">
                    <div className="flex items-center gap-2">
                        <Link href="/"><img src="/logo.png" alt="Indotix" className="h-11 w-36 object-contain" /></Link>
                    </div>
                    <div className="flex flex-1 items-center">
                        <input
                            type="text"
                            placeholder="Cari kota/hotel/wisata/event..."
                            className="h-11 w-full rounded-lg border border-slate-200 px-4 text-sm shadow-sm focus:border-sky-400 focus:outline-none"
                            value={form.q}
                            onChange={(event) => setForm((prev) => ({ ...prev, q: event.target.value }))}
                        />
                    </div>
                    <Link href="/souvenir/cart" className="relative flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-sky-600">
                        <ShoppingCart className="h-4 w-4" />
                        Keranjang
                        {Boolean(souvenir_cart_count) && (
                            <span className="absolute -right-3 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white">
                                {souvenir_cart_count}
                            </span>
                        )}
                    </Link>
                    {!auth?.user && (
                        <div className="flex items-center gap-2">
                            <Link
                                href="/register"
                                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
                            >
                                Register
                            </Link>
                            <Link
                                href="/login"
                                className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"
                            >
                                Login
                            </Link>
                        </div>
                    )}
                    {auth?.user?.role === 'user' && (
                        <div className="flex items-center gap-4 text-sm font-semibold text-slate-600">
                            <Link href="/settings/profile" className="flex items-center gap-2 hover:text-sky-600">
                                <UserCircle className="h-4 w-4" />
                                Profile
                            </Link>
                            {affiliate_menu && (
                                <Link href="/affiliate" className="flex items-center gap-2 hover:text-sky-600">
                                    <BadgePercent className="h-4 w-4" />
                                    Afiliasi
                                </Link>
                            )}
                            <Link href="/history" className="flex items-center gap-2 hover:text-sky-600">
                                <HistoryIcon className="h-4 w-4" />
                                Riwayat
                            </Link>
                            <Link href="/chat" className="flex items-center gap-2 hover:text-sky-600">
                                <MessageCircle className="h-4 w-4" />
                                Chat
                            </Link>
                            <Link href="/notifications" className="relative flex items-center gap-2 hover:text-sky-600">
                                <Bell className="h-4 w-4" />
                                Notifikasi
                                {Boolean(unread_notifications) && (
                                    <span className="absolute -right-3 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                                        {unread_notifications}
                                    </span>
                                )}
                            </Link>
                        </div>
                    )}
                </div>
                <div className="border-t border-slate-100">
                    <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-4 py-3 md:px-8">
                        {categories.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`flex items-center gap-2 text-sm font-semibold ${item.active ? 'text-slate-900' : 'text-slate-500'}`}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>
                <div className="border-t border-slate-100">
                    <div className="mx-auto flex w-full max-w-6xl flex-wrap gap-2 px-4 py-3 md:px-8">
                        {chips.map((chip) => (
                            <span key={chip} className="rounded-full bg-slate-100 px-4 py-1 text-xs font-medium text-slate-600">
                                {chip}
                            </span>
                        ))}
                    </div>
                </div>
            </header>

            <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
                {!isReady && (
                    <section className="space-y-8">
                        <Skeleton className="h-72 w-full rounded-[28px]" />
                        <div className="grid gap-6 md:grid-cols-2">
                            {[0, 1].map((idx) => (
                                <Skeleton key={idx} className="h-32 w-full rounded-2xl" />
                            ))}
                        </div>
                    </section>
                )}

                {isReady && (
                    <>
                        <section className="mb-6">
                            <div className="relative overflow-hidden rounded-[28px] shadow-lg">
                                <img
                                    src={
                                        fallbackImage ??
                                        `https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1920&auto=format&fit=crop`
                                    }
                                    alt="Event"
                                    className="h-72 w-full object-cover md:h-88"
                                />
                                <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-r from-black/60 via-black/45 to-transparent" />
                                <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 text-center text-white">
                                    <h1 className="text-2xl font-semibold md:text-3xl">
                                        Cari event seru? Pesan tiket favoritmu di INDOTIX
                                    </h1>
                                    <p className="mt-2 text-sm text-white/85">
                                        Pilih event, tentukan jadwal, dan amankan tempatmu tanpa antre.
                                    </p>
                                </div>
                            </div>

                            <div className="-mt-24 px-6">
                                <div className="relative z-20 rounded-[24px] bg-white p-5 shadow-[0_18px_40px_-18px_rgba(15,23,42,0.35)]">
                                    <form className="grid gap-4 md:grid-cols-[2fr_1.5fr_1fr_auto]" onSubmit={submitSearch}>
                                        <div className="grid gap-2">
                                            <label className="text-xs font-semibold uppercase text-slate-500">Nama event atau kota</label>
                                            <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm">
                                                <span className="text-slate-400">🎤</span>
                                                <input
                                                    className="w-full bg-transparent outline-none"
                                                    placeholder="Cari nama event atau lokasi"
                                                    value={form.q}
                                                    onChange={(event) => setForm((prev) => ({ ...prev, q: event.target.value }))}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-xs font-semibold uppercase text-slate-500">Tanggal event</label>
                                            <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm">
                                                <span className="text-slate-400">📅</span>
                                                <input
                                                    type="date"
                                                    value={form.visit_date}
                                                    onChange={(event) => setForm((prev) => ({ ...prev, visit_date: event.target.value }))}
                                                    className="w-full bg-transparent outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-xs font-semibold uppercase text-slate-500">Jumlah tiket</label>
                                            <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm">
                                                <span className="text-slate-400">🎟️</span>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    value={form.quantity}
                                                    onChange={(event) => setForm((prev) => ({ ...prev, quantity: Number(event.target.value) }))}
                                                    className="w-20 bg-transparent outline-none"
                                                />
                                            </div>
                                        </div>
                                        <button className="h-12 rounded-full bg-sky-600 px-8 text-sm font-semibold text-white shadow-md">
                                            Cari
                                        </button>
                                    </form>
                                    <div className="mt-4 text-sm font-semibold text-sky-700">Event rekomendasi untukmu</div>
                                </div>
                            </div>
                        </section>

                        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {filtered.map((event) => (
                                <div
                                    key={event.id}
                                    className="group overflow-hidden rounded-xl bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                                >
                                    <Link href={`/events/${event.encrypted_id}`} className="relative block h-28 overflow-hidden">
                                        <img
                                            src={
                                                event.image_url ??
                                                fallbackImage ??
                                                `https://images.unsplash.com/photo-1472653431158-6364773b2a56?q=80&w=1200&auto=format&fit=crop&sig=${event.id}`
                                            }
                                            alt={event.title}
                                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                        <div className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-slate-700 shadow-sm">
                                            Event
                                        </div>
                                    </Link>
                                    <div className="p-3">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h2 className="text-sm font-semibold text-slate-900">{event.title}</h2>
                                                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                                                    <MapPinned className="h-3 w-3 text-sky-500" />
                                                    {event.city_name ?? 'Indonesia'}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500">{event.start_at ?? 'Segera'}</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex items-center justify-between">
                                            <div>
                                                <div className="text-[11px] text-slate-500">Mulai</div>
                                                <div className="text-sm font-semibold text-sky-600">
                                                    {event.min_price ? `Rp ${event.min_price.toLocaleString('id-ID')}` : '-'}
                                                </div>
                                            </div>
                                            <Link
                                                href={`/events/${event.encrypted_id}`}
                                                className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700"
                                            >
                                                Lihat Detail
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {filtered.length === 0 && (
                                <div className="md:col-span-2 rounded-2xl border border-slate-100 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
                                    <div className="text-base font-semibold text-slate-800">Belum ada hasil.</div>
                                    <div className="mt-2">Coba ubah kata kunci untuk menemukan event seru.</div>
                                </div>
                            )}
                        </div>
                    </>
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
                            <li>Souvenir</li>
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
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900">Download Indotix</h4>
                        <div className="mt-3 h-12 w-40 rounded-lg bg-slate-900" />
                        <h4 className="mt-6 text-sm font-semibold text-slate-900">Ikuti Kami</h4>
                        <div className="mt-3 flex gap-2">
                            <div className="h-9 w-9 rounded-full bg-slate-200" />
                            <div className="h-9 w-9 rounded-full bg-slate-200" />
                            <div className="h-9 w-9 rounded-full bg-slate-200" />
                            <div className="h-9 w-9 rounded-full bg-slate-200" />
                            <div className="h-9 w-9 rounded-full bg-slate-200" />
                        </div>
                    </div>
                </div>
                <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
                    © 2025 Indotix. All rights reserved.
                </div>
            </footer>
        </div>
    );
}
