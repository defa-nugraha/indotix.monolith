import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Bell, CalendarCheck, MapPinned, MessageCircle, ShoppingBag, Star, Ticket, UserCircle, History, ShoppingCart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type Product = {
    id: number;
    encrypted_id: string;
    name: string;
    price: number;
    stock: number;
    category?: string | null;
    image_url?: string | null;
};

type Category = {
    id: number;
    name: string;
};

type Filters = {
    q?: string | null;
    category_id?: number | null;
};

export default function SouvenirSearch({
    filters,
    products,
    categories,
}: {
    filters: Filters;
    products: { data: Product[]; links: any[] };
    categories: Category[];
}) {
    const { auth, unread_notifications, souvenir_cart_count } = usePage().props as {
        auth?: { user?: { role?: string } };
        unread_notifications?: number;
        souvenir_cart_count?: number;
    };
    const [isReady, setIsReady] = useState(false);
    const [form, setForm] = useState({
        q: filters.q ?? '',
        category_id: filters.category_id ?? '',
    });

    useEffect(() => {
        const timer = setTimeout(() => setIsReady(true), 350);
        return () => clearTimeout(timer);
    }, []);

    const submitSearch = (event: React.FormEvent) => {
        event.preventDefault();
        router.get('/souvenir', form, { preserveState: true, preserveScroll: true });
    };

    const navItems = [
        { label: 'Wisata', icon: MapPinned, href: '/wisata' },
        { label: 'Event', icon: CalendarCheck, href: '/events' },
        { label: 'Souvenir', icon: ShoppingBag, href: '/souvenir', active: true },
        { label: 'Spesial Program', icon: Star, href: '/special-programs' },
        { label: 'Hotel', icon: Ticket, href: '/stay' },
    ];

    return (
        <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
            <Head title="Souvenir - INDOTIX" />

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
                            <Link href="/register" className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700">
                                Register
                            </Link>
                            <Link href="/login" className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50">
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
            </header>

            <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
                {!isReady && (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, idx) => (
                            <Skeleton key={idx} className="h-64 w-full rounded-2xl" />
                        ))}
                    </div>
                )}

                {isReady && (
                    <>
                        <section className="rounded-2xl bg-white p-6 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl font-semibold text-slate-900">Souvenir Pilihan</h1>
                                    <p className="mt-2 text-sm text-slate-500">Temukan produk khas daerah untuk melengkapi perjalananmu.</p>
                                </div>
                                <form onSubmit={submitSearch} className="flex flex-wrap items-center gap-2">
                                    <input
                                        className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                        placeholder="Cari souvenir"
                                        value={form.q}
                                        onChange={(event) => setForm((prev) => ({ ...prev, q: event.target.value }))}
                                    />
                                    <select
                                        className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                                        value={form.category_id}
                                        onChange={(event) => setForm((prev) => ({ ...prev, category_id: event.target.value }))}
                                    >
                                        <option value="">Semua kategori</option>
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                    <button className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white">Cari</button>
                                </form>
                            </div>
                        </section>

                        <section className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {products.data.map((product) => (
                                <Link
                                    key={product.id}
                                    href={`/souvenir/${product.encrypted_id}`}
                                    className="group overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                                >
                                    <div className="h-48 w-full bg-slate-100">
                                        {product.image_url ? (
                                            <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-sm text-slate-400">Foto belum tersedia</div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <div className="text-xs text-slate-500">{product.category ?? 'Souvenir'}</div>
                                        <h3 className="mt-1 text-base font-semibold text-slate-900">{product.name}</h3>
                                        <div className="mt-2 flex items-center justify-between text-sm">
                                            <span className="font-semibold text-sky-600">Rp {product.price.toLocaleString('id-ID')}</span>
                                            <span className="text-xs text-slate-500">Stok {product.stock}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}
