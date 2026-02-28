import { Head, Link, router, usePage } from '@inertiajs/react';
import { Bell, CalendarCheck, History as HistoryIcon, MapPinned, MessageCircle, ShoppingBag, Star, Ticket, UserCircle, ShoppingCart, BadgePercent } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { FooterDownloadSocial } from '@/components/footer-download-social';
import { Skeleton } from '@/components/ui/skeleton';
import PublicLayout from '@/layouts/public-layout';

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
        { label: 'Retail Shop', icon: ShoppingBag, href: '/souvenir', active: false },
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
        <PublicLayout categories={categories} chips={chips}>
            <Head title="Event">
                <link href="https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700|space-grotesk:500,600,700" rel="stylesheet" />
            </Head>
                        <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
                {!isReady && (
                    <section className="space-y-8">
                        <Skeleton className="h-44 w-full rounded-[28px] sm:h-56 md:h-72" />
                        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-2">
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
                                    className="h-44 w-full object-cover sm:h-56 md:h-72"
                                />
                                <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-r from-black/60 via-black/45 to-transparent" />
                                <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 text-center text-white sm:left-8 sm:right-8">
                                    <h1 className="text-lg font-semibold sm:text-xl md:text-3xl">
                                        Cari event seru? Pesan tiket favoritmu di INDOTIX
                                    </h1>
                                    <p className="mt-2 text-xs text-white/85 sm:text-sm">
                                        Pilih event, tentukan jadwal, dan amankan tempatmu tanpa antre.
                                    </p>
                                </div>
                            </div>

                            <div className="-mt-14 px-4 sm:-mt-20 sm:px-6 md:-mt-24">
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

                        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
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
