import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Bell, CalendarCheck, MapPinned, MessageCircle, ShoppingBag, Star, Ticket, UserCircle, History, ShoppingCart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import PublicLayout from '@/layouts/public-layout';

type Product = {
    id: number;
    encrypted_id?: string;
    slug?: string | null;
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
        { label: 'Retail Shop', icon: ShoppingBag, href: '/souvenir', active: true },
        { label: 'Spesial Program', icon: Star, href: '/special-programs' },
        { label: 'Hotel', icon: Ticket, href: '/stay' },
    ];

    return (
        <PublicLayout categories={navItems}>
            <Head title="Retail Shop - INDOTIX" />

                        <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
                {!isReady && (
                    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
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
                                    <h1 className="text-2xl font-semibold text-slate-900">Retail Shop Pilihan</h1>
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

                        <section className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
                            {products.data.map((product) => {
                                const detailSlug = product.slug ?? product.encrypted_id ?? '';
                                return (
                                <Link
                                    key={product.id}
                                    href={detailSlug ? `/souvenir/${detailSlug}` : '/souvenir'}
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
                                        <div className="text-xs text-slate-500">{product.category ?? 'Retail Shop'}</div>
                                        <h3 className="mt-1 text-base font-semibold text-slate-900">{product.name}</h3>
                                        <div className="mt-2 flex items-center justify-between text-sm">
                                            <span className="font-semibold text-sky-600">Rp {product.price.toLocaleString('id-ID')}</span>
                                            <span className="text-xs text-slate-500">Stok {product.stock}</span>
                                        </div>
                                    </div>
                                </Link>
                                );
                            })}
                        </section>
                    </>
                )}
            </main>
        </PublicLayout>
    );
}
