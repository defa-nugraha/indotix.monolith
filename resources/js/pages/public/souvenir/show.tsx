import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Bell, CalendarCheck, MapPinned, MessageCircle, ShoppingBag, Star, Ticket, UserCircle, History, ShoppingCart, Minus, Plus } from 'lucide-react';
import Swal from 'sweetalert2';

type Variant = {
    id: number;
    name: string;
    variant_type?: string | null;
    sku: string;
    additional_price: number;
    stock: number;
    is_active: boolean;
};

type Product = {
    id: number;
    encrypted_id: string;
    name: string;
    description?: string | null;
    price: number;
    stock: number;
    category?: string | null;
    images: string[];
    variants: Variant[];
};

export default function SouvenirShow({ product }: { product: Product }) {
    const { auth, unread_notifications, souvenir_cart_count } = usePage().props as {
        auth?: { user?: { role?: string } };
        unread_notifications?: number;
        souvenir_cart_count?: number;
    };
    const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
    const [quantity, setQuantity] = useState(1);

    const activeVariants = product.variants.filter((variant) => variant.is_active);
    const variant = activeVariants.find((item) => item.id === selectedVariant);
    const unitPrice = product.price + (variant?.additional_price ?? 0);
    const maxQty = variant ? variant.stock : product.stock;

    const handleAddToCart = () => {
        router.post('/souvenir/cart/add', {
            product_id: product.id,
            variant_id: selectedVariant,
            quantity,
        }, {
            preserveScroll: true,
            onSuccess: () => Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Produk ditambahkan ke keranjang.' }),
            onError: (errors) => Swal.fire({ icon: 'error', title: 'Gagal', text: errors.quantity ?? 'Stok tidak mencukupi.' }),
        });
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
            <Head title={`${product.name} - Souvenir`} />

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
                <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                    <div className="rounded-2xl bg-white p-6 shadow-sm">
                        <div className="grid gap-4">
                            <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
                                <div className="overflow-hidden rounded-2xl bg-slate-100">
                                    {product.images[0] ? (
                                        <img src={product.images[0]} alt={product.name} className="h-80 w-full object-cover" />
                                    ) : (
                                        <div className="flex h-80 items-center justify-center text-sm text-slate-400">Foto belum tersedia</div>
                                    )}
                                </div>
                                <div className="grid gap-3">
                                    {product.images.slice(1, 4).map((image, index) => (
                                        <div key={index} className="overflow-hidden rounded-2xl bg-slate-100">
                                            <img src={image} alt={`${product.name} ${index + 2}`} className="h-24 w-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div className="text-xs text-slate-500">{product.category ?? 'Souvenir'}</div>
                                <h1 className="mt-2 text-2xl font-semibold text-slate-900">{product.name}</h1>
                                <p className="mt-3 text-sm text-slate-600">{product.description ?? 'Produk souvenir pilihan dari INDOTIX.'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm text-slate-500">Harga</div>
                                <div className="text-2xl font-semibold text-sky-600">Rp {unitPrice.toLocaleString('id-ID')}</div>
                            </div>
                            <div className="text-xs text-slate-500">Stok {maxQty}</div>
                        </div>

                        {activeVariants.length > 0 && (
                            <div className="mt-5">
                                <div className="text-sm font-semibold text-slate-700">Pilih Varian</div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {activeVariants.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => setSelectedVariant(item.id)}
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                selectedVariant === item.id
                                                    ? 'bg-sky-600 text-white'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                        >
                                            {item.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-5">
                            <div className="text-sm font-semibold text-slate-700">Jumlah</div>
                            <div className="mt-2 flex items-center gap-3">
                                <button
                                    type="button"
                                    className="rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                                >
                                    <Minus className="h-4 w-4" />
                                </button>
                                <div className="min-w-[40px] text-center text-sm font-semibold">{quantity}</div>
                                <button
                                    type="button"
                                    className="rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                                    onClick={() => setQuantity((prev) => Math.min(maxQty, prev + 1))}
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="mt-6 w-full rounded-xl bg-sky-600 py-3 text-sm font-semibold text-white hover:bg-sky-700"
                            onClick={handleAddToCart}
                        >
                            Tambahkan ke Keranjang
                        </button>
                        <p className="mt-3 text-xs text-slate-500">Kamu bisa membeli lebih dari satu souvenir melalui keranjang.</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
