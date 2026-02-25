import { Head, router } from '@inertiajs/react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type OrderItem = {
    id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    variant?: { name: string } | null;
};

type Refund = {
    id: number;
    type: string;
    amount: number;
    status: string;
};

type Order = {
    id: number;
    status: string;
    payment_status?: string | null;
    total_price: number;
    shipping_method: string;
    shipping_address?: string | null;
    shipping_status?: string | null;
    tracking_number?: string | null;
    user?: { name: string; email: string } | null;
    items: OrderItem[];
    refunds: Refund[];
};

export default function SouvenirOrderShow({ order }: { order: Order }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Retail Shop', href: '/admin/souvenir/products' },
        { title: 'Order & Transaksi', href: '/admin/souvenir/orders' },
        { title: `Order #${order.id}`, href: `/admin/souvenir/orders/${order.id}` },
    ];

    const updateStatus = (status: string) => {
        router.post(`/admin/souvenir/orders/${order.id}/status`, { status }, {
            preserveScroll: true,
            onSuccess: () => Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Status order diperbarui.' }),
            onError: () => Swal.fire({ icon: 'error', title: 'Gagal', text: 'Tidak dapat memperbarui status.' }),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Order Retail Shop #${order.id}`} />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">Order #{order.id}</h1>
                            <p className="text-sm text-slate-500">Detail lengkap transaksi souvenir.</p>
                        </div>
                        <Badge className={order.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600'}>
                            {order.status}
                        </Badge>
                    </div>
                    <div className="mt-6 grid gap-3 text-sm text-slate-600">
                        <div>Nama Pemesan: {order.user?.name ?? 'Guest'}</div>
                        <div>Email: {order.user?.email ?? '-'}</div>
                        <div>Total: Rp {order.total_price.toLocaleString('id-ID')}</div>
                        <div>Metode Pengiriman: {order.shipping_method}</div>
                        <div>Alamat: {order.shipping_address ?? '-'}</div>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Item Pesanan</h2>
                    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Produk</th>
                                    <th className="px-4 py-3 text-left">Qty</th>
                                    <th className="px-4 py-3 text-left">Harga</th>
                                    <th className="px-4 py-3 text-left">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items.map((item) => (
                                    <tr key={item.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3">{item.product_name} {item.variant ? `(${item.variant.name})` : ''}</td>
                                        <td className="px-4 py-3">{item.quantity}</td>
                                        <td className="px-4 py-3">Rp {item.unit_price.toLocaleString('id-ID')}</td>
                                        <td className="px-4 py-3">Rp {item.subtotal.toLocaleString('id-ID')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Aksi</h2>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => updateStatus('processing')}>Proses Order</Button>
                        <Button variant="outline" onClick={() => updateStatus('shipped')}>Tandai Shipped</Button>
                        <Button variant="outline" onClick={() => updateStatus('completed')}>Selesaikan</Button>
                        <Button variant="outline" onClick={() => updateStatus('cancelled')}>Batalkan</Button>
                    </div>
                </section>

                {order.refunds.length > 0 && (
                    <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">Refund</h2>
                        <div className="mt-4 grid gap-2">
                            {order.refunds.map((refund) => (
                                <div key={refund.id} className="rounded-xl border border-slate-100 p-3 text-sm">
                                    <div>Refund #{refund.id} · {refund.type} · Rp {refund.amount.toLocaleString('id-ID')}</div>
                                    <div className="text-xs text-slate-500">Status: {refund.status}</div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </AppLayout>
    );
}
