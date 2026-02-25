import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Bell, CalendarCheck, MapPinned, MessageCircle, ShoppingBag, Star, Ticket, UserCircle, History, ShoppingCart, BadgePercent } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import PublicLayout from '@/layouts/public-layout';

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
    { label: 'Event', icon: CalendarCheck, href: '/events' },
    { label: 'Retail Shop', icon: ShoppingBag, href: '/souvenir' },
    { label: 'Spesial Program', icon: Star, href: '/special-programs' },
    { label: 'Hotel', icon: Ticket, href: '/stay' },
];

const chips = ['Alam', 'Budaya', 'Edukasi', 'Kuliner', 'Desa Wisata', 'Religi', 'Pantai', 'Gunung', 'Taman Nasional', 'Air Terjun', 'Danau'];

export default function WisataSearch({ filters, destinations }: { filters: Filters; destinations: Destination[] }) {
    const { auth, unread_notifications, souvenir_cart_count, affiliate_menu, affiliate_referral } = usePage().props as {
        auth?: { user?: { role?: string } };
        unread_notifications?: number;
        souvenir_cart_count?: number;
        affiliate_menu?: boolean;
        affiliate_referral?: { code: string; destination_name?: string | null } | null;
    };
    const [isReady, setIsReady] = useState(false);
    const [form, setForm] = useState({
        q: filters.q ?? '',
        visit_date: filters.visit_date ?? new Date().toISOString().slice(0, 10),
        quantity: filters.quantity ?? 1,
    });
    const affiliateForm = useForm({ code: '' });

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
        <PublicLayout categories={navItems} chips={chips}>
            <Head title="Wisata - INDOTIX" />

                        <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
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
                <section className="mb-6 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
                    {affiliate_referral ? (
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">
                                    Kamu datang dari rekomendasi partner kami {affiliate_referral.destination_name ? `untuk ${affiliate_referral.destination_name}` : ''}.
                                </p>
                                <p className="mt-1 text-xs text-slate-500">Kode afiliasi aktif: {affiliate_referral.code}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => router.post('/affiliate/referral/clear', {}, { preserveScroll: true })}
                                className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                            >
                                Hapus kode
                            </button>
                        </div>
                    ) : (
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                affiliateForm.post('/affiliate/referral/apply', { preserveScroll: true });
                            }}
                            className="flex flex-col gap-3 md:flex-row md:items-end"
                        >
                            <div className="flex-1 space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Punya kode afiliasi?</label>
                                <input
                                    value={affiliateForm.data.code}
                                    onChange={(event) => affiliateForm.setData('code', event.target.value)}
                                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm focus:border-sky-400 focus:outline-none"
                                    placeholder="Masukkan kode afiliasi"
                                />
                                {affiliateForm.errors.code && <p className="text-xs text-rose-500">{affiliateForm.errors.code}</p>}
                            </div>
                            <button
                                type="submit"
                                disabled={affiliateForm.processing}
                                className="h-11 rounded-xl bg-sky-600 px-5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                            >
                                Terapkan
                            </button>
                        </form>
                    )}
                </section>

                <section className="mb-6">
                    <div className="relative overflow-hidden rounded-[28px] shadow-lg">
                        <img
                            src={
                                fallbackImage ??
                                `https://images.unsplash.com/photo-1506929562872-bb421503ef21?q=80&w=1920&auto=format&fit=crop`
                            }
                            alt="Wisata"
                            className="h-44 w-full object-cover sm:h-56 md:h-72"
                        />
                        <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-r from-black/60 via-black/45 to-transparent" />
                        <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 text-center text-white sm:left-8 sm:right-8">
                            <h1 className="text-lg font-semibold sm:text-xl md:text-3xl">
                                Mau ke mana dulu? Pesan tiket wisata favoritmu di INDOTIX
                            </h1>
                            <p className="mt-2 text-xs text-white/85 sm:text-sm">
                                Pilih destinasi, tentukan tanggal, lalu nikmati liburan tanpa ribet.
                            </p>
                        </div>
                    </div>

                    <div className="-mt-14 px-4 sm:-mt-20 sm:px-6 md:-mt-24">
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

                <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
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
        </PublicLayout>
    );
}
