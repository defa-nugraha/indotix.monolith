import { Head, Link, usePage } from '@inertiajs/react';
import { Bell, MessageCircle, UserCircle, History, ShoppingCart, ShoppingBag } from 'lucide-react';
import PublicLayout from '@/layouts/public-layout';

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
        <PublicLayout>
            <Head title="Detail Pesanan Souvenir" />
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
        </PublicLayout>
    );
}
