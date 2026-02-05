import { Head, Link, router, usePage } from '@inertiajs/react';
import { Bell, CalendarCheck, MapPinned, MessageCircle, ShoppingBag, Star, Ticket, UserCircle, History, ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';

type CartItem = {
    key: string;
    product_id: number;
    variant_id?: number | null;
    encrypted_product_id: string;
    name: string;
    variant_name?: string | null;
    price: number;
    quantity: number;
    subtotal: number;
    image_url?: string | null;
    stock: number;
};

export default function SouvenirCart({ items, summary }: { items: CartItem[]; summary: { subtotal: number; total: number } }) {
    const { auth, unread_notifications, souvenir_cart_count } = usePage().props as {
        auth?: { user?: { role?: string } };
        unread_notifications?: number;
        souvenir_cart_count?: number;
    };

    const navItems = [
        { label: 'Wisata', icon: MapPinned, href: '/wisata' },
        { label: 'Event', icon: CalendarCheck, href: '/events' },
        { label: 'Souvenir', icon: ShoppingBag, href: '/souvenir', active: true },
        { label: 'Spesial Program', icon: Star, href: '/special-programs' },
        { label: 'Hotel', icon: Ticket, href: '/stay' },
    ];

    const updateQuantity = (item: CartItem, quantity: number) => {
        router.post('/souvenir/cart/update', {
            product_id: item.product_id,
            variant_id: item.variant_id,
            quantity,
        }, {
            preserveScroll: true,
            onError: (errors) => Swal.fire({ icon: 'error', title: 'Gagal', text: errors.quantity ?? 'Stok tidak mencukupi.' }),
        });
    };

    const removeItem = (item: CartItem) => {
        router.post('/souvenir/cart/remove', {
            product_id: item.product_id,
            variant_id: item.variant_id,
        }, { preserveScroll: true });
    };

    return (
        <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
            <Head title="Keranjang Souvenir" />

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
                <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                    <section className="rounded-2xl bg-white p-6 shadow-sm">
                        <h1 className="text-2xl font-semibold text-slate-900">Keranjang Souvenir</h1>
                        <p className="mt-2 text-sm text-slate-500">Cek kembali produk sebelum melanjutkan pembayaran.</p>

                        {items.length === 0 && (
                            <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                                Keranjang masih kosong. Yuk pilih souvenir favoritmu.
                            </div>
                        )}

                        <div className="mt-6 space-y-4">
                            {items.map((item) => (
                                <div key={item.key} className="flex flex-col gap-4 rounded-2xl border border-slate-100 p-4 md:flex-row md:items-center">
                                    <div className="h-24 w-24 overflow-hidden rounded-xl bg-slate-100">
                                        {item.image_url ? (
                                            <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-xs text-slate-400">Foto</div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-semibold text-slate-900">{item.name}</div>
                                        {item.variant_name && <div className="text-xs text-slate-500">Varian: {item.variant_name}</div>}
                                        <div className="mt-2 text-sm font-semibold text-sky-600">Rp {item.price.toLocaleString('id-ID')}</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            className="rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                                            onClick={() => updateQuantity(item, Math.max(1, item.quantity - 1))}
                                        >
                                            <Minus className="h-4 w-4" />
                                        </button>
                                        <span className="min-w-[32px] text-center text-sm font-semibold">{item.quantity}</span>
                                        <button
                                            type="button"
                                            className="rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                                            onClick={() => updateQuantity(item, Math.min(item.stock, item.quantity + 1))}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <div className="text-sm font-semibold text-slate-900">Rp {item.subtotal.toLocaleString('id-ID')}</div>
                                    <button
                                        type="button"
                                        className="rounded-full border border-rose-200 p-2 text-rose-500 hover:bg-rose-50"
                                        onClick={() => removeItem(item)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>

                    <aside className="rounded-2xl bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">Ringkasan</h2>
                        <div className="mt-4 space-y-2 text-sm">
                            <div className="flex items-center justify-between text-slate-600">
                                <span>Subtotal</span>
                                <span>Rp {summary.subtotal.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-900">
                                <span className="font-semibold">Total</span>
                                <span className="font-semibold">Rp {summary.total.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                        <Link
                            href="/souvenir/checkout"
                            className={`mt-6 flex w-full items-center justify-center rounded-xl py-3 text-sm font-semibold text-white ${
                                items.length === 0 ? 'pointer-events-none bg-slate-300' : 'bg-sky-600 hover:bg-sky-700'
                            }`}
                        >
                            Lanjutkan Pembayaran
                        </Link>
                    </aside>
                </div>
            </main>
        </div>
    );
}
