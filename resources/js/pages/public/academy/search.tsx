import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { Bell, CalendarCheck, History as HistoryIcon, MapPinned, MessageCircle, ShoppingBag, Star, Ticket, UserCircle, BookOpen, ShoppingCart, BadgePercent } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import PublicLayout from '@/layouts/public-layout';

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
        <PublicLayout categories={categories} chips={chips}>
            <Head title="Eljohn Academy">
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
                                        `https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1920&auto=format&fit=crop`
                                    }
                                    alt="Academy"
                                    className="h-44 w-full object-cover sm:h-56 md:h-72"
                                />
                                <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-r from-black/60 via-black/45 to-transparent" />
                                <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 text-center text-white sm:left-8 sm:right-8">
                                    <h1 className="text-lg font-semibold sm:text-xl md:text-3xl">
                                        Upgrade skill bareng Eljohn Academy di INDOTIX
                                    </h1>
                                    <p className="mt-2 text-xs text-white/85 sm:text-sm">
                                        Pilih kelas favorit, amankan seat, dan belajar langsung dari mentor terbaik.
                                    </p>
                                </div>
                            </div>

                            <div className="-mt-14 px-4 sm:-mt-20 sm:px-6 md:-mt-24">
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

                        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
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
        </PublicLayout>
    );
}
