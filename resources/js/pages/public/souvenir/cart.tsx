import { Head, Link, router, usePage } from '@inertiajs/react';
import { Bell, CalendarCheck, MapPinned, MessageCircle, ShoppingBag, Star, Ticket, UserCircle, History, ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import PublicLayout from '@/layouts/public-layout';
import { guardPurchaseByRole } from '@/lib/purchase-guard';

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
    const role = auth?.user?.role;

    const navItems = [
        { label: 'Wisata', icon: MapPinned, href: '/wisata' },
        { label: 'Event', icon: CalendarCheck, href: '/events' },
        { label: 'Retail Shop', icon: ShoppingBag, href: '/retail-shop', active: true },
        { label: 'Spesial Program', icon: Star, href: '/special-programs' },
        { label: 'Hotel', icon: Ticket, href: '/stay' },
    ];

    const updateQuantity = (item: CartItem, quantity: number) => {
        router.post('/retail-shop/cart/update', {
            product_id: item.product_id,
            variant_id: item.variant_id,
            quantity,
        }, {
            preserveScroll: true,
            onError: (errors) => Swal.fire({ icon: 'error', title: 'Gagal', text: errors.quantity ?? 'Stok tidak mencukupi.' }),
        });
    };

    const removeItem = (item: CartItem) => {
        router.post('/retail-shop/cart/remove', {
            product_id: item.product_id,
            variant_id: item.variant_id,
        }, { preserveScroll: true });
    };

    return (
        <PublicLayout categories={navItems}>
            <Head title="Keranjang Retail Shop" />

                        <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
                <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                    <section className="rounded-2xl bg-white p-6 shadow-sm">
                        <h1 className="text-2xl font-semibold text-slate-900">Keranjang Retail Shop</h1>
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
                            href="/retail-shop/checkout"
                            className={`mt-6 flex w-full items-center justify-center rounded-xl py-3 text-sm font-semibold text-white ${
                                items.length === 0 ? 'pointer-events-none bg-slate-300' : 'bg-sky-600 hover:bg-sky-700'
                            }`}
                            onClick={(event) => {
                                if (guardPurchaseByRole(role)) {
                                    event.preventDefault();
                                }
                            }}
                        >
                            Lanjutkan Pembayaran
                        </Link>
                    </aside>
                </div>
            </main>
        </PublicLayout>
    );
}
