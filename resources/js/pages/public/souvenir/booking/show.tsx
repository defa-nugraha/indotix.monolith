import { Head, Link, usePage } from '@inertiajs/react';
import { Bell, MessageCircle, UserCircle, History, ShoppingCart, ShoppingBag } from 'lucide-react';

type OrderItem = {
    name: string;
    sku?: string | null;
    quantity: number;
    unit_price: number;
    subtotal: number;
};

type Order = {
    id: number;
    encrypted_id: string;
    status: string;
    payment_status?: string | null;
    payment_deadline?: string | null;
    total_price: number;
    shipping_address?: string | null;
    items: OrderItem[];
};

export default function SouvenirBookingShow({ order }: { order: Order }) {
    const { auth, unread_notifications, souvenir_cart_count } = usePage().props as {
        auth?: { user?: { role?: string } };
        unread_notifications?: number;
        souvenir_cart_count?: number;
    };

    return (
        <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
            <Head title="Detail Pesanan Souvenir" />
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
                            <Link href="/chat" className="flex items-center gap-2 hover:text-sky-600">
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
            </header>

            <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8">
                <div className="rounded-3xl bg-white p-6 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">Detail Pesanan Souvenir</h1>
                            <p className="mt-2 text-sm text-slate-500">Pesanan #{order.id} · Status: {order.status}</p>
                        </div>
                        <ShoppingBag className="h-8 w-8 text-sky-500" />
                    </div>
                    <div className="mt-6 grid gap-4">
                        <div className="rounded-2xl border border-slate-100 p-4">
                            <div className="text-sm font-semibold text-slate-700">Alamat Pengiriman</div>
                            <div className="mt-2 text-sm text-slate-600">{order.shipping_address ?? '-'}</div>
                        </div>
                        <div className="rounded-2xl border border-slate-100 p-4">
                            <div className="text-sm font-semibold text-slate-700">Barang Pesanan</div>
                            <div className="mt-3 space-y-2 text-sm">
                                {order.items.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <div>
                                            <div className="font-semibold text-slate-900">{item.name}</div>
                                            <div className="text-xs text-slate-500">{item.quantity} x Rp {item.unit_price.toLocaleString('id-ID')}</div>
                                        </div>
                                        <div className="font-semibold text-slate-700">Rp {item.subtotal.toLocaleString('id-ID')}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="rounded-2xl border border-slate-100 p-4">
                            <div className="flex items-center justify-between text-sm font-semibold">
                                <span>Total Pembayaran</span>
                                <span>Rp {order.total_price.toLocaleString('id-ID')}</span>
                            </div>
                            {order.payment_deadline && (
                                <div className="mt-2 text-xs text-slate-500">
                                    Batas bayar: {new Date(order.payment_deadline).toLocaleString('id-ID')}
                                </div>
                            )}
                        </div>
                        <Link href="/history" className="text-sm font-semibold text-sky-600">
                            Lihat riwayat pesanan
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
