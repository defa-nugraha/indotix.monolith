import { Head, router, useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Refund = {
    id: number;
    type: string;
    amount: number;
    status: string;
    order?: { id: number } | null;
};

export default function SouvenirRefundsIndex({ refunds, orders }: { refunds: { data: Refund[]; links: any[] }; orders: Array<{ id: number }> }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Retail Shop', href: '/admin/souvenir/products' },
        { title: 'Refund & Retur', href: '/admin/souvenir/refunds' },
    ];

    const form = useForm({
        souvenir_order_id: '',
        type: 'partial',
        amount: 0,
        reason: '',
    });

    const submit = () => {
        form.post('/admin/souvenir/refunds', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Refund dibuat.' });
            },
            onError: () => Swal.fire({ icon: 'error', title: 'Gagal', text: 'Tidak dapat membuat refund.' }),
        });
    };

    const updateStatus = (refundId: number, status: string) => {
        router.put(`/admin/souvenir/refunds/${refundId}`, { status }, {
            preserveScroll: true,
            onSuccess: () => Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Status refund diperbarui.' }),
            onError: () => Swal.fire({ icon: 'error', title: 'Gagal', text: 'Tidak dapat memperbarui refund.' }),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Refund Retail Shop" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-slate-900">Refund & Retur</h1>
                    <p className="text-sm text-slate-500">Catat cancel/refund dengan alasan yang jelas.</p>
                    <div className="mt-6 grid gap-3 md:grid-cols-4">
                        <select
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            value={form.data.souvenir_order_id}
                            onChange={(event) => form.setData('souvenir_order_id', event.target.value)}
                        >
                            <option value="">Pilih order</option>
                            {orders.map((order) => (
                                <option key={order.id} value={order.id}>
                                    Order #{order.id}
                                </option>
                            ))}
                        </select>
                        <select
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            value={form.data.type}
                            onChange={(event) => form.setData('type', event.target.value)}
                        >
                            <option value="partial">Partial</option>
                            <option value="full">Full</option>
                        </select>
                        <input
                            type="number"
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            placeholder="Nominal refund"
                            value={form.data.amount}
                            onChange={(event) => form.setData('amount', Number(event.target.value))}
                        />
                        <Button className="bg-sky-600 text-white hover:bg-sky-700" type="button" onClick={submit}>
                            Simpan Refund
                        </Button>
                        <textarea
                            className="md:col-span-4 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            placeholder="Alasan refund"
                            value={form.data.reason}
                            onChange={(event) => form.setData('reason', event.target.value)}
                        />
                    </div>
                </section>

                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Refund</th>
                                    <th className="px-4 py-3 text-left">Order</th>
                                    <th className="px-4 py-3 text-left">Nominal</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {refunds.data.map((refund) => (
                                    <tr key={refund.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3 font-semibold text-slate-900">Refund #{refund.id}</td>
                                        <td className="px-4 py-3">Order #{refund.order?.id ?? '-'}</td>
                                        <td className="px-4 py-3">Rp {refund.amount.toLocaleString('id-ID')}</td>
                                        <td className="px-4 py-3">
                                            <Badge className={refund.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : refund.status === 'rejected' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}>
                                                {refund.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                <Button size="sm" variant="outline" onClick={() => updateStatus(refund.id, 'approved')}>Approve</Button>
                                                <Button size="sm" variant="outline" onClick={() => updateStatus(refund.id, 'rejected')}>Reject</Button>
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
