import { Head, Link, router } from '@inertiajs/react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Order = {
    id: number;
    status: string;
    payment_status?: string | null;
    total_price: number;
    shipping_method: string;
    shipping_status?: string | null;
    tracking_number?: string | null;
    user?: { id: number; name: string; email: string } | null;
    items?: Array<{ id: number }>;
};

type Props = {
    orders: { data: Order[]; links: Array<{ url: string | null; label: string; active: boolean }> };
    filters: { status?: string };
    mode?: 'orders' | 'fulfillment';
};

export default function SouvenirOrdersIndex({ orders, filters, mode = 'orders' }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Retail Shop', href: '/admin/souvenir/products' },
        { title: mode === 'fulfillment' ? 'Fulfillment & Pengiriman' : 'Order & Transaksi', href: mode === 'fulfillment' ? '/admin/souvenir/fulfillment' : '/admin/souvenir/orders' },
    ];

    const updateStatus = (orderId: number, status: string) => {
        router.post(`/admin/souvenir/orders/${orderId}/status`, { status }, {
            preserveScroll: true,
            onSuccess: () => Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Status order diperbarui.' }),
            onError: () => Swal.fire({ icon: 'error', title: 'Gagal', text: 'Tidak dapat memperbarui status.' }),
        });
    };

    const updateShipping = (orderId: number) => {
        Swal.fire({
            title: 'Update Pengiriman',
            html: '<input id="tracking" class="swal2-input" placeholder="Nomor resi" />' +
                '<input id="status" class="swal2-input" placeholder="Status pengiriman" />',
            preConfirm: () => {
                const tracking = (document.getElementById('tracking') as HTMLInputElement).value;
                const status = (document.getElementById('status') as HTMLInputElement).value;
                return { tracking, status };
            },
            showCancelButton: true,
            confirmButtonText: 'Simpan',
        }).then((result) => {
            if (!result.isConfirmed) return;
            router.post(`/admin/souvenir/orders/${orderId}/shipping`, {
                tracking_number: result.value.tracking,
                shipping_status: result.value.status,
            }, {
                preserveScroll: true,
                onSuccess: () => Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Pengiriman diperbarui.' }),
                onError: () => Swal.fire({ icon: 'error', title: 'Gagal', text: 'Tidak dapat memperbarui pengiriman.' }),
            });
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={mode === 'fulfillment' ? 'Fulfillment Retail Shop' : 'Order Retail Shop'} />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">
                        {mode === 'fulfillment' ? 'Fulfillment & Pengiriman' : 'Monitoring Order Retail Shop'}
                    </h1>
                    <p className="text-sm text-slate-500">Pantau status order, pembayaran, dan pengiriman.</p>
                    <form
                        className="mt-4 grid gap-3 md:grid-cols-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            const formData = new FormData(event.currentTarget);
                            router.get(mode === 'fulfillment' ? '/admin/souvenir/fulfillment' : '/admin/souvenir/orders', Object.fromEntries(formData.entries()));
                        }}
                    >
                        <select name="status" defaultValue={filters.status ?? ''} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                            <option value="">Semua status</option>
                            <option value="pending_payment">pending_payment</option>
                            <option value="paid">paid</option>
                            <option value="processing">processing</option>
                            <option value="shipped">shipped</option>
                            <option value="ready_pickup">ready_pickup</option>
                            <option value="completed">completed</option>
                            <option value="cancelled">cancelled</option>
                        </select>
                        <Button className="bg-sky-600 text-white hover:bg-sky-700" type="submit">Filter</Button>
                    </form>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Order</th>
                                    <th className="px-4 py-3 text-left">User</th>
                                    <th className="px-4 py-3 text-left">Total</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.data.map((order) => (
                                    <tr key={order.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-900">INDOTIX-SOUV-{order.id}</div>
                                            <div className="text-xs text-slate-500">{order.items?.length ?? 0} item</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {order.user?.name ?? 'Guest'}
                                            <div className="text-xs text-slate-500">{order.user?.email ?? '-'}</div>
                                        </td>
                                        <td className="px-4 py-3">Rp {order.total_price.toLocaleString('id-ID')}</td>
                                        <td className="px-4 py-3">
                                            <Badge className={order.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600'}>
                                                {order.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                <Link href={`/admin/souvenir/orders/${order.id}`} className="text-xs font-semibold text-sky-600">
                                                    Detail
                                                </Link>
                                                <Button size="sm" variant="outline" onClick={() => updateStatus(order.id, order.status === 'processing' ? 'shipped' : 'processing')}>
                                                    {order.status === 'processing' ? 'Tandai Shipped' : 'Proses'}
                                                </Button>
                                                {mode === 'fulfillment' && (
                                                    <Button size="sm" variant="outline" onClick={() => updateShipping(order.id)}>
                                                        Update Resi
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
