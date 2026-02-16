import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Bell, CalendarCheck, MapPinned, MessageCircle, ShoppingBag, Star, Ticket, UserCircle, History, ShoppingCart, Minus, Plus } from 'lucide-react';
import Swal from 'sweetalert2';
import PublicLayout from '@/layouts/public-layout';

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
        <PublicLayout categories={navItems}>
            <Head title={`${product.name} - Souvenir`} />

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
                        <Link
                            href={`/chat/start/souvenir/${product.id}`}
                            className="mt-3 block w-full rounded-xl border border-slate-200 py-3 text-center text-sm font-semibold text-slate-600 hover:bg-slate-50"
                        >
                            Chat Admin
                        </Link>
                        <p className="mt-3 text-xs text-slate-500">Kamu bisa membeli lebih dari satu souvenir melalui keranjang.</p>
                    </div>
                </div>
            </main>
        </PublicLayout>
    );
}
