import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { Bell, CalendarCheck, History as HistoryIcon, MapPinned, MessageCircle, ShoppingBag, Star, Ticket, UserCircle, BookOpen, ShoppingCart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type AcademyCard = {
    id: number;
    encrypted_id: string;
    title: string;
    category?: string | null;
    start_at?: string | null;
    location?: string | null;
    min_price?: number | null;
    image_url?: string | null;
};

export default function AcademySearch({
    classes = [],
    filters,
}: {
    classes: AcademyCard[];
    filters: { q?: string | null };
}) {
    const { auth, unread_notifications, souvenir_cart_count } = usePage().props as { auth?: { user?: { role?: string } }; unread_notifications?: number; souvenir_cart_count?: number };
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
        { label: 'Event', icon: CalendarCheck, href: '/events', active: false },
        { label: 'Souvenir', icon: ShoppingBag, href: '/souvenir', active: false },
        { label: 'Spesial Program', icon: Star, href: '/special-programs', active: false },
        { label: 'Academy', icon: BookOpen, href: '/academy', active: true },
        { label: 'Hotel', icon: Ticket, href: '/stay', active: false },
    ];
    const chips = ['Hospitality', 'Event', 'Marketing', 'Leadership', 'Operasional', 'Digital', 'Public Speaking', 'Branding', 'Keuangan', 'Customer Care'];

    const submitSearch = (event: React.FormEvent) => {
        event.preventDefault();
        router.get('/academy', { q: form.q }, { preserveState: true, preserveScroll: true });
    };

    const filtered = useMemo(() => classes, [classes]);
    const fallbackImage = classes.find((item) => item.image_url)?.image_url;

    return (
        <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
            <Head title="Eljohn Academy">
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
                            <Link href="/history" className="flex items-center gap-2 hover:text-sky-600">
                                <HistoryIcon className="h-4 w-4" />
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
                                        `https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1920&auto=format&fit=crop`
                                    }
                                    alt="Academy"
                                    className="h-72 w-full object-cover md:h-88"
                                />
                                <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-r from-black/60 via-black/45 to-transparent" />
                                <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 text-center text-white">
                                    <h1 className="text-2xl font-semibold md:text-3xl">
                                        Upgrade skill bareng Eljohn Academy di INDOTIX
                                    </h1>
                                    <p className="mt-2 text-sm text-white/85">
                                        Pilih kelas favorit, amankan seat, dan belajar langsung dari mentor terbaik.
                                    </p>
                                </div>
                            </div>

                            <div className="-mt-24 px-6">
                                <div className="relative z-20 rounded-[24px] bg-white p-5 shadow-[0_18px_40px_-18px_rgba(15,23,42,0.35)]">
                                    <form className="grid gap-4 md:grid-cols-[2fr_1.5fr_1fr_auto]" onSubmit={submitSearch}>
                                        <div className="grid gap-2">
                                            <label className="text-xs font-semibold uppercase text-slate-500">Nama kelas atau kategori</label>
                                            <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm">
                                                <span className="text-slate-400">🎓</span>
                                                <input
                                                    className="w-full bg-transparent outline-none"
                                                    placeholder="Cari kelas academy"
                                                    value={form.q}
                                                    onChange={(event) => setForm((prev) => ({ ...prev, q: event.target.value }))}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-xs font-semibold uppercase text-slate-500">Tanggal kelas</label>
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
                                    <div className="mt-4 text-sm font-semibold text-sky-700">Kelas rekomendasi untukmu</div>
                                </div>
                            </div>
                        </section>

                        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {filtered.map((item) => (
                                <div
                                    key={item.id}
                                    className="group overflow-hidden rounded-xl bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                                >
                                    <Link href={`/academy/${item.encrypted_id}`} className="relative block h-28 overflow-hidden">
                                        <img
                                            src={
                                                item.image_url ??
                                                fallbackImage ??
                                                `https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1200&auto=format&fit=crop&sig=${item.id}`
                                            }
                                            alt={item.title}
                                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                        <div className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-slate-700 shadow-sm">
                                            Academy
                                        </div>
                                    </Link>
                                    <div className="p-3">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h2 className="text-sm font-semibold text-slate-900">{item.title}</h2>
                                                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                                                    <BookOpen className="h-3 w-3 text-sky-500" />
                                                    {item.category ?? 'Kelas Academy'}
                                                </p>
                                            </div>
                                            <span className="text-xs font-semibold text-sky-600">{item.start_at ?? '-'}</span>
                                        </div>
                                        <div className="mt-3 flex items-center justify-between">
                                            <span className="text-xs text-slate-500">{item.location ?? 'Lokasi kelas'}</span>
                                            <span className="text-sm font-semibold text-sky-600">
                                                {item.min_price ? `Rp ${item.min_price.toLocaleString('id-ID')}` : '-'}
                                            </span>
                                        </div>
                                        <Link
                                            href={`/academy/${item.encrypted_id}`}
                                            className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white"
                                        >
                                            Lihat Detail
                                        </Link>
                                    </div>
                                </div>
                            ))}
                            {filtered.length === 0 && (
                                <div className="col-span-full rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                                    Belum ada kelas academy.
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
