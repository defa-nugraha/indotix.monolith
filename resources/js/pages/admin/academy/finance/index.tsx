import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Swal from 'sweetalert2';

type Refund = {
    id: number;
    amount: number;
    status: string;
    reason?: string | null;
    academy_booking_id: number;
};

type Props = {
    summary: { gross: number; paid_count: number; refund_total: number };
    refunds: Refund[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Eljohn Academy', href: '/admin/academy/classes' },
    { title: 'Keuangan', href: '/admin/academy/finance' },
];

export default function AcademyFinance({ summary, refunds }: Props) {
    const form = useForm({
        booking_id: '',
        amount: 0,
        reason: '',
    });

    const submit = () => {
        if (!form.data.booking_id) return;
        router.post(`/admin/academy/bookings/${form.data.booking_id}/refund`, {
            amount: Number(form.data.amount || 0),
            reason: form.data.reason,
        }, {
            onSuccess: () => Swal.fire({ icon: 'success', title: 'Refund dibuat' }),
            onError: () => Swal.fire({ icon: 'error', title: 'Gagal refund' }),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Keuangan Academy" />
            <div className="flex flex-1 flex-col gap-6 bg-[#f6fbff] px-6 py-8">
                <section className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                    <p className="text-xs font-semibold uppercase text-sky-600">Academy</p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-900">Monitoring Transaksi</h1>
                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                        <div className="rounded-2xl border border-slate-100 p-4">
                            <p className="text-xs uppercase text-slate-500">Total Penjualan</p>
                            <p className="mt-2 text-lg font-semibold text-slate-900">
                                Rp {summary.gross.toLocaleString('id-ID')}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 p-4">
                            <p className="text-xs uppercase text-slate-500">Booking Paid</p>
                            <p className="mt-2 text-lg font-semibold text-slate-900">{summary.paid_count}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 p-4">
                            <p className="text-xs uppercase text-slate-500">Refund Total</p>
                            <p className="mt-2 text-lg font-semibold text-slate-900">
                                Rp {summary.refund_total.toLocaleString('id-ID')}
                            </p>
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
                    <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">Refund Manual</h2>
                        <form
                            className="mt-4 grid gap-3"
                            onSubmit={(event) => {
                                event.preventDefault();
                                submit();
                            }}
                        >
                            <input
                                value={form.data.booking_id}
                                onChange={(event) => form.setData('booking_id', event.target.value)}
                                placeholder="ID Booking"
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                            <input
                                type="number"
                                min={0}
                                value={form.data.amount}
                                onChange={(event) => form.setData('amount', Number(event.target.value))}
                                placeholder="Nominal refund"
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                            <textarea
                                value={form.data.reason}
                                onChange={(event) => form.setData('reason', event.target.value)}
                                placeholder="Alasan"
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                rows={3}
                            />
                            <Button type="submit" className="bg-sky-600 text-white hover:bg-sky-700">
                                Proses Refund
                            </Button>
                        </form>
                    </div>
                    <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">Riwayat Refund</h2>
                        <div className="mt-4 grid gap-3">
                            {refunds.map((refund) => (
                                <div key={refund.id} className="rounded-2xl border border-slate-100 p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">
                                                Booking #{refund.academy_booking_id}
                                            </p>
                                            <p className="text-xs text-slate-500">{refund.reason ?? '-'}</p>
                                        </div>
                                        <Badge className="bg-slate-100 text-slate-700">{refund.status}</Badge>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-600">
                                        Rp {refund.amount.toLocaleString('id-ID')}
                                    </p>
                                </div>
                            ))}
                            {refunds.length === 0 && (
                                <div className="text-sm text-slate-500">Belum ada refund.</div>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
