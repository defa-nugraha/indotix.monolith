import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { CalendarDays, MapPinned, Star, Ticket } from 'lucide-react';
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
    { label: 'Wisata', icon: MapPinned, href: '/wisata' },
    { label: 'Event', icon: CalendarDays, href: '/?tab=event' },
    { label: 'Souvenir', icon: Ticket, href: '/?tab=souvenir' },
    { label: 'Spesial Program', icon: Star, href: '/?tab=program' },
    { label: 'Hotel', icon: MapPinned, href: '/stay' },
];

const chips = ['Alam', 'Budaya', 'Edukasi', 'Kuliner', 'Desa Wisata', 'Religi', 'Pantai', 'Gunung', 'Taman Nasional', 'Air Terjun', 'Danau'];

export default function WisataSearch({ filters, destinations }: { filters: Filters; destinations: Destination[] }) {
    const { auth } = usePage().props as { auth?: { user?: { role?: string } } };
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

    return (
        <div className="min-h-screen bg-[#f6fbff] font-['Plus_Jakarta_Sans'] text-slate-900">
            <Head title="Wisata - INDOTIX" />

            <header className="border-b border-slate-100 bg-white">
                <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
                    <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                        <img src="/logo.png" alt="Indotix" className="h-9" />
                    </Link>
                    <div className="flex flex-1 items-center gap-4">
                        <form onSubmit={submitSearch} className="flex w-full items-center gap-3 rounded-full border border-slate-200 px-4 py-2">
                            <input
                                value={form.q}
                                onChange={(event) => setForm((prev) => ({ ...prev, q: event.target.value }))}
                                placeholder="Cari kota/wisata..."
                                className="w-full text-sm focus:outline-none"
                            />
                        </form>
                        {auth?.user?.role === 'user' ? (
                            <div className="flex items-center gap-4 text-sm font-semibold text-slate-600">
                                <Link href="/settings/profile" className="hover:text-sky-600">Profile</Link>
                                <Link href="/history" className="hover:text-sky-600">Riwayat</Link>
                                <Link href="/?tab=chat" className="hover:text-sky-600">Chat</Link>
                                <Link href="/notifications" className="hover:text-sky-600">Notifikasi</Link>
                            </div>
                        ) : (
                            <>
                                <Link href="/register" className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white">
                                    Gabung Mitra
                                </Link>
                                <Link href="/login" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                                    Login
                                </Link>
                            </>
                        )}
                    </div>
                </div>
                <div className="border-t border-slate-100">
                    <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3 text-sm font-semibold text-slate-600">
                        {navItems.map((item) => (
                            <Link key={item.label} href={item.href} className="flex items-center gap-2">
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>
                <div className="border-t border-slate-100">
                    <div className="mx-auto flex max-w-6xl flex-wrap gap-2 px-6 py-3">
                        {chips.map((chip) => (
                            <span key={chip} className="rounded-full bg-slate-100 px-4 py-1 text-xs font-semibold text-slate-600">
                                {chip}
                            </span>
                        ))}
                    </div>
                </div>
            </header>

            <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-wrap items-center gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">
                                Wisata
                            </p>
                            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Temukan tiket wisata terbaik</h1>
                            <p className="text-sm text-slate-500">Pilih tanggal kunjungan dan jumlah tiket.</p>
                        </div>
                        <form onSubmit={submitSearch} className="ml-auto flex flex-wrap items-center gap-3">
                            <input
                                type="date"
                                value={form.visit_date}
                                onChange={(event) => setForm((prev) => ({ ...prev, visit_date: event.target.value }))}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                            <input
                                type="number"
                                min={1}
                                value={form.quantity}
                                onChange={(event) => setForm((prev) => ({ ...prev, quantity: Number(event.target.value) }))}
                                className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                            <button type="submit" className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white">
                                Cari
                            </button>
                        </form>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {!isReady &&
                        Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
                                <Skeleton className="h-40 w-full rounded-2xl" />
                                <Skeleton className="mt-4 h-4 w-2/3" />
                                <Skeleton className="mt-2 h-3 w-1/3" />
                            </div>
                        ))}
                    {isReady &&
                        destinations.map((item) => (
                            <div key={item.id} className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
                                {item.photo_url ? (
                                    <img src={item.photo_url} alt={item.destination_name} className="h-40 w-full rounded-2xl object-cover" />
                                ) : (
                                    <div className="h-40 w-full rounded-2xl bg-slate-100" />
                                )}
                                <div className="mt-4">
                                    <h3 className="text-lg font-semibold text-slate-900">{item.destination_name}</h3>
                                    <p className="text-sm text-slate-500">{item.city_name ?? 'Indonesia'}</p>
                                </div>
                                <div className="mt-3 flex flex-col gap-2">
                                    {item.tickets.slice(0, 2).map((ticket) => (
                                        <div key={ticket.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                                            <span>{ticket.name}</span>
                                            <span className="font-semibold text-sky-600">Rp {ticket.price.toLocaleString('id-ID')}</span>
                                        </div>
                                    ))}
                                </div>
                                <Link
                                    href={`/wisata/${item.encrypted_id}`}
                                    className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white"
                                >
                                    Lihat Detail
                                </Link>
                            </div>
                        ))}
                    {isReady && destinations.length === 0 && (
                        <div className="rounded-3xl border border-slate-100 bg-white p-6 text-center text-sm text-slate-500 shadow-sm md:col-span-2 lg:col-span-3">
                            Belum ada destinasi wisata yang tersedia untuk tanggal ini.
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
