import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Bell, CalendarCheck, MapPinned, MessageCircle, ShoppingBag, Star, Ticket, UserCircle, History } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type Destination = {
    id: number;
    encrypted_id: string;
    destination_name: string;
    destination_type?: string | null;
    city_name?: string | null;
    photo_url?: string | null;
    tickets: { id: number; name: string; price: number; available: number }[];
};

type Filters = {
    q?: string | null;
    visit_date?: string | null;
    quantity?: number;
};

const navItems = [
    { label: 'Wisata', icon: MapPinned, href: '/wisata', active: true },
    { label: 'Event', icon: CalendarCheck, href: '/?/events' },
    { label: 'Souvenir', icon: ShoppingBag, href: '/?tab=souvenir' },
    { label: 'Spesial Program', icon: Star, href: '/?tab=spesial' },
    { label: 'Hotel', icon: Ticket, href: '/stay' },
];

const chips = ['Alam', 'Budaya', 'Edukasi', 'Kuliner', 'Desa Wisata', 'Religi', 'Pantai', 'Gunung', 'Taman Nasional', 'Air Terjun', 'Danau'];

export default function WisataSearch({ filters, destinations }: { filters: Filters; destinations: Destination[] }) {
    const { auth, unread_notifications } = usePage().props as { auth?: { user?: { role?: string } }; unread_notifications?: number };
    const [isReady, setIsReady] = useState(false);
    const [form, setForm] = useState({
        q: filters.q ?? '',
        visit_date: filters.visit_date ?? new Date().toISOString().slice(0, 10),
        quantity: filters.quantity ?? 1,
    });

    useEffect(() => {
        const timer = setTimeout(() => setIsReady(true), 400);
        return () => clearTimeout(timer);
    }, []);

    const submitSearch = (event: React.FormEvent) => {
        event.preventDefault();
        router.get('/wisata', form, { preserveState: true, preserveScroll: true });
    };
    const fallbackImage = destinations.find((item) => item.photo_url)?.photo_url;

    return (
        <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
            <Head title="Wisata - INDOTIX" />

            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-4 py-4 md:px-8">
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="Indotix" className="h-8" />
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
                    {!auth?.user && (
                        <div className="flex items-center gap-2">
                            <Link
                                href="/register"
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
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
                            <Link href="/history" className="flex items-center gap-2 hover:text-sky-600">
                                <History className="h-4 w-4" />
                                Riwayat
                            </Link>
                            <Link href="/?tab=chat" className="flex items-center gap-2 hover:text-sky-600">
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
                        {navItems.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`flex items-center gap-2 text-sm font-semibold ${
                                    item.active ? 'text-slate-900' : 'text-slate-500'
                                }`}
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

            <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
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
                                `https://images.unsplash.com/photo-1506929562872-bb421503ef21?q=80&w=1920&auto=format&fit=crop`
                            }
                            alt="Wisata"
                            className="h-72 w-full object-cover md:h-88"
                        />
                        <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-r from-black/60 via-black/45 to-transparent" />
                        <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 text-center text-white">
                            <h1 className="text-2xl font-semibold md:text-3xl">
                                Mau ke mana dulu? Pesan tiket wisata favoritmu di INDOTIX
                            </h1>
                            <p className="mt-2 text-sm text-white/85">
                                Pilih destinasi, tentukan tanggal, lalu nikmati liburan tanpa ribet.
                            </p>
                        </div>
                    </div>

                    <div className="-mt-24 px-6">
                        <div className="relative z-20 rounded-[24px] bg-white p-5 shadow-[0_18px_40px_-18px_rgba(15,23,42,0.35)]">
                            <form className="grid gap-4 md:grid-cols-[2fr_1.5fr_1fr_auto]" onSubmit={submitSearch}>
                                <div className="grid gap-2">
                                    <label className="text-xs font-semibold uppercase text-slate-500">Kota atau destinasi wisata</label>
                                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm">
                                        <span className="text-slate-400">📍</span>
                                        <input
                                            className="w-full bg-transparent outline-none"
                                            placeholder="Cari kota atau nama destinasi"
                                            value={form.q}
                                            onChange={(event) => setForm((prev) => ({ ...prev, q: event.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-xs font-semibold uppercase text-slate-500">Tanggal kunjungan</label>
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
                            <div className="mt-4 text-sm font-semibold text-sky-700">Destinasi rekomendasi untukmu</div>
                        </div>
                    </div>
                </section>

                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {destinations.map((item) => (
                        <div
                            key={item.id}
                            className="group overflow-hidden rounded-xl bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                        >
                            <Link
                                href={`/wisata/${item.encrypted_id}`}
                                className="relative block h-28 overflow-hidden"
                            >
                                <img
                                    src={
                                        item.photo_url ??
                                        fallbackImage ??
                                        `https://images.unsplash.com/photo-1506929562872-bb421503ef21?q=80&w=1200&auto=format&fit=crop&sig=${item.id}`
                                    }
                                    alt={item.destination_name}
                                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                <div className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-slate-700 shadow-sm">
                                    {item.destination_type ?? 'Wisata'}
                                </div>
                            </Link>
                            <div className="p-3">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h2 className="text-sm font-semibold text-slate-900">{item.destination_name}</h2>
                                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                                            <MapPinned className="h-3 w-3 text-sky-500" />
                                            {item.city_name ?? 'Indonesia'}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center justify-between">
                                    <div>
                                        <div className="text-[11px] text-slate-500">Mulai</div>
                                        <div className="text-sm font-semibold text-sky-600">
                                            {item.tickets[0]?.price ? `Rp ${item.tickets[0].price.toLocaleString('id-ID')}` : '-'}
                                        </div>
                                    </div>
                                    <Link
                                        href={`/wisata/${item.encrypted_id}`}
                                        className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700"
                                    >
                                        Lihat Detail
                                    </Link>
                                </div>
                                <div className="mt-3 flex flex-col gap-2">
                                    {item.tickets.slice(0, 2).map((ticket) => (
                                        <div key={ticket.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs">
                                            <span className="text-slate-600">{ticket.name}</span>
                                            <span className="font-semibold text-sky-600">Rp {ticket.price.toLocaleString('id-ID')}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}

                    {destinations.length === 0 && (
                        <div className="md:col-span-2 rounded-2xl border border-slate-100 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
                            <div className="text-base font-semibold text-slate-800">Belum ada hasil.</div>
                            <div className="mt-2">Silakan pilih tanggal untuk melihat destinasi yang tersedia.</div>
                        </div>
                    )}
                </div>
                </>
                )}
            </div>
        </div>
    );
}
